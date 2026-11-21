import type { Actor } from '@/server/shared/auth/actor';
import { writeAudit } from '@/server/shared/audit/write-audit';
import { CacheTtl, cachedRead, invalidate } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import { formatCop } from '@/lib/money';
import { hiddenFromAdmin, type CreditKind, type CreditMeasure, type CreditStatus } from '@/server/modules/credits/domain/credit';
import type { ChargeableAppointment, CreditRecord, CreditRepository } from '@/server/modules/credits/application/ports';

export type PublicCredit = {
  id: string;
  clientId: string;
  clientName: string;
  barberId: string;
  barberName: string;
  kind: CreditKind;
  note: string | null;
  status: CreditStatus;
  measure: CreditMeasure | null;
  limitCuts: number | null;
  limitAmount: number | null;
  usedCuts: number;
  usedAmount: number;
  createdAt: string;
  chargeable: ChargeableAppointment[];
};

const rank: Record<CreditStatus, number> = {
  pending_barber: 0,
  pending_admin: 0,
  active: 1,
  admin_rejected: 2,
  barber_rejected: 2,
  closed: 3,
};

function kindPhrase(kind: CreditKind) {
  return kind === 'prepaid' ? 'por adelantado' : 'para pagar después';
}

function cupoPhrase(input: { kind: CreditKind; measure: CreditMeasure; limit: number }) {
  const amount = input.measure === 'cuts' ? `${input.limit} cortes` : formatCop(input.limit);
  return `${amount} ${kindPhrase(input.kind)}`;
}

function remainingPhrase(row: CreditRecord) {
  if (row.measure === 'cuts' && row.limitCuts != null) {
    return `${Math.max(row.limitCuts - row.usedCuts, 0)} cortes`;
  }
  if (row.measure === 'budget' && row.limitAmount != null) {
    return formatCop(Math.max(row.limitAmount - row.usedAmount, 0));
  }
  return 'el cupo';
}

export class CreditService {
  constructor(private readonly credits: CreditRepository) {}

  list(actor: Actor) {
    return cachedRead(`credits:${actor.id}`, CacheTtl.lists, () => this.load(actor));
  }

  private async load(actor: Actor) {
    if (actor.role === 'client') {
      const [barbers, requests] = await Promise.all([
        this.credits.barbersForClient(actor.id),
        this.credits.listForClient(actor.id),
      ]);
      return { barbers: barbers.map(({ id, name }) => ({ id, name })), requests: await this.present(requests, false) };
    }
    if (actor.role === 'barber') {
      const barberId = await this.credits.barberIdForUser(actor.id);
      if (!barberId) return { barbers: [], requests: [] };
      return { barbers: [], requests: await this.present(await this.credits.listForBarber(barberId), true) };
    }
    if (actor.role === 'admin' || actor.role === 'superadmin') {
      return { barbers: [], requests: await this.present(await this.credits.listForAdmin(), true) };
    }
    throw new DomainError('FORBIDDEN', 'No puedes ver el crédito.');
  }

  async ask(actor: Actor, input: { barberId: string; kind: CreditKind; note: string | null }) {
    if (actor.role !== 'client') throw new DomainError('FORBIDDEN', 'Solo un cliente puede pedir crédito.');
    const barbers = await this.credits.barbersForClient(actor.id);
    const barber = barbers.find((item) => item.id === input.barberId);
    if (!barber) throw new DomainError('FORBIDDEN', 'Pide el crédito a un barbero con el que ya tienes cita.');
    if (await this.credits.openForPair(actor.id, barber.id)) {
      throw new DomainError('INVALID_STATE', 'Ya tienes un crédito abierto con ese barbero.');
    }
    const saved = await this.credits.create({
      clientId: actor.id,
      barberId: barber.id,
      kind: input.kind,
      note: input.note,
    });
    await writeAudit(actor.id, 'credit.ask', saved.id);
    await this.safeTell(actor.id, barber.userId, `${actor.displayName} pidió un crédito ${kindPhrase(input.kind)}.`);
    invalidate('credits:');
    return this.present([saved], false).then((rows) => rows[0]);
  }

  async barberAnswer(actor: Actor, id: string, answer: 'accepted' | 'rejected') {
    if (actor.role !== 'barber') throw new DomainError('FORBIDDEN', 'Solo el barbero responde este pedido.');
    const row = await this.require(id);
    const barberId = await this.credits.barberIdForUser(actor.id);
    if (!barberId || row.barberId !== barberId) throw new DomainError('FORBIDDEN', 'Ese pedido no es tuyo.');
    if (row.status !== 'pending_barber') throw new DomainError('INVALID_STATE', 'Ese pedido ya fue respondido.');
    if (answer === 'rejected') {
      const saved = await this.credits.markBarber(id, 'barber_rejected');
      await writeAudit(actor.id, 'credit.barber_reject', id);
      await this.safeTell(actor.id, row.clientId, 'No acepté tu pedido de crédito.');
      invalidate('credits:');
      return (await this.present([saved], true))[0];
    }
    const saved = await this.credits.markBarber(id, 'pending_admin');
    await writeAudit(actor.id, 'credit.barber_accept', id);
    const admins = await this.credits.usersByRole(['admin', 'superadmin']);
    for (const admin of admins) {
      await this.safeTell(actor.id, admin.id, `Acepté el crédito de ${row.clientName}. Define el cupo cuando puedas.`);
    }
    invalidate('credits:');
    return (await this.present([saved], true))[0];
  }

  async adminDecide(actor: Actor, id: string, input: {
    answer: 'approved' | 'rejected';
    kind?: CreditKind;
    measure?: CreditMeasure;
    limit?: number;
  }) {
    if (actor.role !== 'admin' && actor.role !== 'superadmin') {
      throw new DomainError('FORBIDDEN', 'Solo el administrador define el cupo.');
    }
    const row = await this.requireForAdmin(id);
    if (row.status !== 'pending_admin') throw new DomainError('INVALID_STATE', 'Ese pedido ya fue decidido.');
    if (input.answer === 'rejected') {
      const saved = await this.credits.markAdmin(id, { status: 'admin_rejected', adminUserId: actor.id });
      await writeAudit(actor.id, 'credit.admin_reject', id);
      await this.safeTell(row.barberUserId, row.clientId, 'El administrador no aprobó el crédito.');
      await this.safeTell(actor.id, row.barberUserId, `No aprobé el crédito de ${row.clientName}.`);
      invalidate('credits:');
      return (await this.present([saved], true))[0];
    }
    const kind = input.kind ?? row.kind;
    const measure = input.measure;
    const limit = input.limit;
    if (measure !== 'cuts' && measure !== 'budget') {
      throw new DomainError('VALIDATION', 'Elige cortes o presupuesto.');
    }
    if (!Number.isInteger(limit)) throw new DomainError('VALIDATION', 'El cupo tiene que ser un número entero.');
    if (measure === 'cuts' && (limit! < 1 || limit! > 48)) {
      throw new DomainError('VALIDATION', 'El cupo de cortes va de 1 a 48.');
    }
    if (measure === 'budget' && (limit! < 1000 || limit! > 20_000_000)) {
      throw new DomainError('VALIDATION', 'El presupuesto va de 1.000 a 20.000.000 pesos.');
    }
    const saved = await this.credits.markAdmin(id, {
      status: 'active',
      adminUserId: actor.id,
      kind,
      measure,
      limitCuts: measure === 'cuts' ? limit! : null,
      limitAmount: measure === 'budget' ? limit! : null,
    });
    await writeAudit(actor.id, 'credit.admin_approve', id);
    const summary = cupoPhrase({ kind, measure, limit: limit! });
    await this.safeTell(row.barberUserId, row.clientId, `Tu crédito quedó aprobado: ${summary}.`);
    await this.safeTell(actor.id, row.barberUserId, `Aprobé el crédito de ${row.clientName}: ${summary}.`);
    invalidate('credits:');
    return (await this.present([saved], true))[0];
  }

  async charge(actor: Actor, id: string, appointmentId: string) {
    const row = await this.requireChargeable(actor, id);
    if (row.status !== 'active') throw new DomainError('INVALID_STATE', 'Ese cupo no está activo.');
    const saved = await this.credits.charge(id, appointmentId);
    await writeAudit(actor.id, 'credit.use', id);
    await this.safeTell(saved.barberUserId, saved.clientId, `Cargué un corte a tu crédito. Te quedan ${remainingPhrase(saved)}.`);
    invalidate('credits:');
    return (await this.present([saved], true))[0];
  }

  async close(actor: Actor, id: string) {
    if (actor.role !== 'admin' && actor.role !== 'superadmin') {
      throw new DomainError('FORBIDDEN', 'Solo el administrador cierra el cupo.');
    }
    const row = await this.requireForAdmin(id);
    if (row.status !== 'active') throw new DomainError('INVALID_STATE', 'Solo se cierra un cupo activo.');
    const saved = await this.credits.markAdmin(id, { status: 'closed', adminUserId: actor.id });
    await writeAudit(actor.id, 'credit.close', id);
    await this.safeTell(row.barberUserId, row.clientId, 'El administrador cerró tu cupo de crédito.');
    invalidate('credits:');
    return (await this.present([saved], true))[0];
  }

  private async require(id: string) {
    const row = await this.credits.require(id);
    if (!row) throw new DomainError('NOT_FOUND', 'No encontramos ese pedido.');
    return row;
  }

  private async requireForAdmin(id: string) {
    const row = await this.require(id);
    if (hiddenFromAdmin(row.status)) throw new DomainError('NOT_FOUND', 'Ese pedido no está disponible.');
    return row;
  }

  private async requireChargeable(actor: Actor, id: string) {
    if (actor.role === 'admin' || actor.role === 'superadmin') return this.requireForAdmin(id);
    if (actor.role === 'barber') {
      const row = await this.require(id);
      const barberId = await this.credits.barberIdForUser(actor.id);
      if (!barberId || row.barberId !== barberId) throw new DomainError('FORBIDDEN', 'Ese cupo no es tuyo.');
      return row;
    }
    throw new DomainError('FORBIDDEN', 'No puedes cargar este crédito.');
  }

  private async present(rows: CreditRecord[], withCharges: boolean): Promise<PublicCredit[]> {
    const sorted = rows.slice().sort((left, right) => rank[left.status] - rank[right.status] || +right.createdAt - +left.createdAt);
    const views: PublicCredit[] = [];
    for (const row of sorted) {
      views.push({
        id: row.id,
        clientId: row.clientId,
        clientName: row.clientName,
        barberId: row.barberId,
        barberName: row.barberName,
        kind: row.kind,
        note: row.note,
        status: row.status,
        measure: row.measure,
        limitCuts: row.limitCuts,
        limitAmount: row.limitAmount,
        usedCuts: row.usedCuts,
        usedAmount: row.usedAmount,
        createdAt: row.createdAt.toISOString(),
        chargeable: withCharges && row.status === 'active' ? await this.credits.chargeable(row) : [],
      });
    }
    return views;
  }

  private async safeTell(senderId: string, recipientId: string, body: string) {
    try {
      await this.credits.tell(senderId, recipientId, body);
    } catch {
      // El pedido ya quedó guardado. El aviso del chat no lo deshace.
    }
  }
}
