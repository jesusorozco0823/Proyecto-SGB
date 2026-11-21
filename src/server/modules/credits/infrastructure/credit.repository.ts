import type { Prisma, PrismaClient } from '@prisma/client';
import { invalidate } from '@/server/shared/cache/read-cache';
import { decimalToNumber, isUniqueViolation } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import { ADMIN_VISIBLE_STATUSES, OPEN_STATUSES } from '@/server/modules/credits/domain/credit';
import type { ChargeableAppointment, CreditRecord, CreditRepository } from '@/server/modules/credits/application/ports';

const include = {
  client: { select: { displayName: true } },
  barber: { select: { name: true, userId: true } },
} satisfies Prisma.CreditRequestInclude;

type CreditRow = Prisma.CreditRequestGetPayload<{ include: typeof include }>;

const appointmentInclude = {
  barberService: true,
  services: { include: { service: true } },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;

function toRecord(row: CreditRow): CreditRecord {
  return {
    id: row.id,
    clientId: row.clientId,
    clientName: row.client.displayName,
    barberId: row.barberId,
    barberName: row.barber.name,
    barberUserId: row.barber.userId,
    kind: row.kind,
    note: row.note,
    status: row.status,
    measure: row.measure,
    limitCuts: row.limitCuts,
    limitAmount: row.limitAmount == null ? null : decimalToNumber(row.limitAmount),
    usedCuts: row.usedCuts,
    usedAmount: decimalToNumber(row.usedAmount),
    createdAt: row.createdAt,
  };
}

function appointmentPrice(row: AppointmentRow) {
  if (row.barberService) return decimalToNumber(row.barberService.price);
  return row.services.reduce((sum, line) => sum + decimalToNumber(line.price), 0);
}

function appointmentService(row: AppointmentRow) {
  if (row.barberService) return row.barberService.name;
  const names = row.services.map((line) => line.service.name);
  return names.length > 0 ? names.join(', ') : 'Cita';
}

export class PrismaCreditRepository implements CreditRepository {
  constructor(private readonly db: PrismaClient) {}

  async barbersForClient(clientId: string) {
    const [appointments, waiting] = await Promise.all([
      this.db.appointment.findMany({
        where: { userId: clientId },
        distinct: ['barberId'],
        select: { barber: { select: { id: true, name: true, userId: true } } },
      }),
      this.db.waitlistEntry.findMany({
        where: { userId: clientId },
        distinct: ['barberId'],
        select: { barber: { select: { id: true, name: true, userId: true } } },
      }),
    ]);
    const seen = new Set<string>();
    return [...appointments, ...waiting]
      .map((row) => row.barber)
      .filter((barber) => {
        if (seen.has(barber.id)) return false;
        seen.add(barber.id);
        return true;
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'es'));
  }

  async barberIdForUser(userId: string) {
    const barber = await this.db.barber.findUnique({ where: { userId }, select: { id: true } });
    return barber?.id ?? null;
  }

  async openForPair(clientId: string, barberId: string) {
    const open = await this.db.creditRequest.findFirst({
      where: { clientId, barberId, status: { in: [...OPEN_STATUSES] } },
      select: { id: true },
    });
    return Boolean(open);
  }

  async create(input: { clientId: string; barberId: string; kind: CreditRow['kind']; note: string | null }) {
    const saved = await this.db.creditRequest.create({ data: input, include });
    return toRecord(saved);
  }

  async require(id: string) {
    const row = await this.db.creditRequest.findUnique({ where: { id }, include });
    return row ? toRecord(row) : null;
  }

  async listForClient(clientId: string) {
    const rows = await this.db.creditRequest.findMany({
      where: { clientId },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }

  async listForBarber(barberId: string) {
    const rows = await this.db.creditRequest.findMany({
      where: { barberId },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }

  async listForAdmin() {
    const rows = await this.db.creditRequest.findMany({
      where: { status: { in: [...ADMIN_VISIBLE_STATUSES] } },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toRecord);
  }

  async usersByRole(roles: Array<'admin' | 'superadmin'>) {
    return this.db.user.findMany({
      where: { role: { in: roles } },
      select: { id: true },
    });
  }

  async markBarber(id: string, status: 'barber_rejected' | 'pending_admin') {
    const saved = await this.db.creditRequest.update({ where: { id }, data: { status }, include });
    return toRecord(saved);
  }

  async markAdmin(id: string, input: {
    status: 'admin_rejected' | 'active' | 'closed';
    adminUserId: string;
    kind?: CreditRow['kind'];
    measure?: CreditRow['measure'];
    limitCuts?: number | null;
    limitAmount?: number | null;
  }) {
    const saved = await this.db.creditRequest.update({
      where: { id },
      data: {
        status: input.status,
        adminUserId: input.adminUserId,
        kind: input.kind,
        measure: input.measure,
        limitCuts: input.limitCuts,
        limitAmount: input.limitAmount,
      },
      include,
    });
    return toRecord(saved);
  }

  async chargeable(record: Pick<CreditRecord, 'id' | 'clientId' | 'barberId'>): Promise<ChargeableAppointment[]> {
    const used = await this.db.creditUse.findMany({
      where: { creditId: record.id },
      select: { appointmentId: true },
    });
    const rows = await this.db.appointment.findMany({
      where: {
        userId: record.clientId,
        barberId: record.barberId,
        status: { in: ['scheduled', 'completed'] },
        id: { notIn: used.map((item) => item.appointmentId) },
      },
      include: appointmentInclude,
      orderBy: { startsAt: 'desc' },
      take: 6,
    });
    return rows.map((row) => ({
      id: row.id,
      service: appointmentService(row),
      when: row.startsAt.toISOString(),
      price: appointmentPrice(row),
    }));
  }

  async charge(creditId: string, appointmentId: string) {
    try {
      return await this.db.$transaction(async (tx) => {
        const credit = await tx.creditRequest.findUnique({ where: { id: creditId }, include });
        if (!credit || credit.status !== 'active') {
          throw new DomainError('INVALID_STATE', 'Ese cupo no está activo.');
        }
        const appointment = await tx.appointment.findUnique({ where: { id: appointmentId }, include: appointmentInclude });
        if (!appointment || appointment.userId !== credit.clientId || appointment.barberId !== credit.barberId) {
          throw new DomainError('VALIDATION', 'Esa cita no corresponde a este crédito.');
        }
        if (appointment.status !== 'scheduled' && appointment.status !== 'completed') {
          throw new DomainError('INVALID_STATE', 'Solo puedes cargar una cita programada o completada.');
        }
        const price = appointmentPrice(appointment);
        if (credit.measure === 'cuts') {
          if (credit.usedCuts + 1 > (credit.limitCuts ?? 0)) {
            throw new DomainError('INVALID_STATE', 'Ya no quedan cortes en ese cupo.');
          }
          const saved = await tx.creditRequest.update({
            where: { id: creditId },
            data: { usedCuts: { increment: 1 }, uses: { create: { appointmentId, cuts: 1, amount: 0 } } },
            include,
          });
          return toRecord(saved);
        }
        const limit = credit.limitAmount == null ? 0 : decimalToNumber(credit.limitAmount);
        const spent = decimalToNumber(credit.usedAmount);
        if (price <= 0) throw new DomainError('VALIDATION', 'Esa cita no tiene un precio para cargar.');
        if (spent + price > limit) throw new DomainError('INVALID_STATE', 'Ese corte no cabe en el presupuesto que queda.');
        const saved = await tx.creditRequest.update({
          where: { id: creditId },
          data: { usedAmount: { increment: price }, uses: { create: { appointmentId, cuts: 0, amount: price } } },
          include,
        });
        return toRecord(saved);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new DomainError('INVALID_STATE', 'Esa cita ya se cargó al crédito.');
      throw error;
    }
  }

  async tell(senderId: string, recipientId: string, body: string) {
    if (senderId === recipientId) return;
    await this.db.message.create({
      data: { senderId, recipientId, body: body.slice(0, 500) },
    });
    invalidate(`messages:${senderId}:`, `messages:${recipientId}:`);
  }
}
