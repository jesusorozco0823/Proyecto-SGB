import type { PrismaClient } from '@prisma/client';
import type { Actor } from '@/server/shared/auth/actor';
import { assertRole } from '@/server/shared/auth/authorize';
import { DomainError } from '@/server/shared/errors/domain-error';
import { CacheTtl, cachedRead, invalidate } from '@/server/shared/cache/read-cache';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import { writeAudit } from '@/server/shared/audit/write-audit';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';

function calendarDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new DomainError('VALIDATION', 'La fecha no es válida.');
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export class SalonService {
  constructor(
    private readonly db: PrismaClient,
    private readonly barbers: BarberRepository,
  ) {}

  settings(actor: Actor) {
    assertRole(actor, ['admin', 'barber', 'superadmin', 'client']);
    return cachedRead('salon:settings', CacheTtl.settings, async () => {
      const policy = await this.db.lunchPolicy.findUnique({ where: { id: 'default' } });
      return {
        durationMinutes: policy?.durationMinutes ?? 60,
        depositAmount: policy ? decimalToNumber(policy.depositAmount) : 0,
        commissionPercent: policy?.commissionPercent ?? 40,
        lowStockThreshold: policy?.lowStockThreshold ?? 5,
      };
    });
  }

  async updateSettings(actor: Actor, input: { durationMinutes: number; depositAmount: number; commissionPercent: number; lowStockThreshold: number }) {
    assertRole(actor, ['admin']);
    const saved = await this.db.lunchPolicy.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...input },
      update: input,
    });
    await writeAudit(actor.id, 'salon.settings', 'default');
    invalidate('salon:settings', 'cash:');
    return {
      durationMinutes: saved.durationMinutes,
      depositAmount: decimalToNumber(saved.depositAmount),
      commissionPercent: saved.commissionPercent,
      lowStockThreshold: saved.lowStockThreshold,
    };
  }

  async holidays(actor: Actor) {
    assertRole(actor, ['admin', 'barber']);
    const rows = await this.db.holiday.findMany({ orderBy: { date: 'asc' } });
    return rows.map((row) => ({ date: row.date.toISOString().slice(0, 10), reason: row.reason }));
  }

  async addHoliday(actor: Actor, date: string, reason: string) {
    assertRole(actor, ['admin']);
    const day = calendarDate(date);
    await this.db.holiday.upsert({ where: { date: day }, create: { date: day, reason }, update: { reason } });
    await this.db.dayTurn.deleteMany({ where: { date: day, status: 'open' } });
    await writeAudit(actor.id, 'salon.holiday', date);
    return { date, reason };
  }

  async removeHoliday(actor: Actor, date: string) {
    assertRole(actor, ['admin']);
    await this.db.holiday.deleteMany({ where: { date: calendarDate(date) } });
    await writeAudit(actor.id, 'salon.holiday.remove', date);
    return { ok: true };
  }

  async addDayOff(actor: Actor, date: string, reason: string) {
    const barber = await this.ownBarber(actor);
    const day = calendarDate(date);
    await this.db.dayOff.upsert({
      where: { barberId_date: { barberId: barber.id, date: day } },
      create: { barberId: barber.id, date: day, reason },
      update: { reason },
    });
    await this.db.dayTurn.deleteMany({ where: { barberId: barber.id, date: day, status: 'open' } });
    await writeAudit(actor.id, 'salon.dayoff', `${barber.id}:${date}`);
    return { date, reason };
  }

  async joinWaitlist(actor: Actor, input: { barberId: string; serviceId: string; date: string }) {
    assertRole(actor, ['client']);
    const user = await this.db.user.findUnique({ where: { id: actor.id }, select: { blockedAt: true } });
    if (user?.blockedAt) throw new DomainError('FORBIDDEN', 'Esta cuenta no puede reservar. Habla con el salón.');
    const day = calendarDate(input.date);
    await this.db.waitlistEntry.upsert({
      where: { userId_barberId_serviceId_date: { userId: actor.id, barberId: input.barberId, serviceId: input.serviceId, date: day } },
      create: { userId: actor.id, barberId: input.barberId, serviceId: input.serviceId, date: day },
      update: { status: 'waiting' },
    });
    return { ok: true };
  }

  async reminders(actor: Actor, date: string) {
    assertRole(actor, ['admin', 'barber']);
    const day = calendarDate(date);
    const next = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const own = actor.role === 'barber' ? await this.barbers.findByUserId(actor.id) : null;
    const rows = await this.db.appointment.findMany({
      where: {
        status: 'scheduled',
        attendance: 'pending',
        startsAt: { gte: new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()), lt: new Date(next.getUTCFullYear(), next.getUTCMonth(), next.getUTCDate()) },
        ...(own ? { barberId: own.id } : {}),
      },
      include: { client: true, barber: true, barberService: true },
      orderBy: { startsAt: 'asc' },
    });
    return rows.map((row) => {
      const message = `Hola ${row.client.displayName}, ¿confirmas tu cita del ${date} a las ${row.startsAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} con ${row.barber.name}? Responde en SGB: Sí voy o No voy.`;
      const digits = (row.client.phone ?? '').replace(/\D/g, '');
      return {
        id: row.id,
        client: row.client.displayName,
        phone: row.client.phone,
        service: row.barberService?.name ?? 'Cita',
        message,
        whatsapp: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null,
      };
    });
  }

  cashCut(actor: Actor, from: string, to: string) {
    assertRole(actor, ['admin', 'barber']);
    const key = actor.role === 'barber' ? `cash:${actor.id}:${from}:${to}` : `cash:admin:${from}:${to}`;
    return cachedRead(key, CacheTtl.lists, () => this.loadCashCut(actor, from, to));
  }

  private async loadCashCut(actor: Actor, from: string, to: string) {
    const start = calendarDate(from);
    const end = new Date(calendarDate(to).getTime() + 24 * 60 * 60 * 1000);
    const own = actor.role === 'barber' ? await this.ownBarber(actor) : null;
    const localStart = new Date(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
    const localEnd = new Date(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
    const appointments = await this.db.appointment.findMany({
      where: { status: 'completed', startsAt: { gte: localStart, lt: localEnd }, ...(own ? { barberId: own.id } : {}) },
      include: { barberService: true, services: { include: { service: true } }, barber: true, client: true },
      orderBy: { startsAt: 'desc' },
    });
    const priced = appointments.map((row) => {
      const price = row.barberService
        ? decimalToNumber(row.barberService.price)
        : row.services.reduce((inner, line) => inner + decimalToNumber(line.price), 0);
      const service = row.barberService?.name
        ?? (row.services.length > 0 ? row.services.map((line) => line.service.name).join(' y ') : 'Servicio');
      return {
        id: row.id,
        when: row.startsAt.toISOString(),
        client: row.client.displayName,
        service,
        price: Math.round(price * 100) / 100,
      };
    });
    const grouped = new Map<string, { count: number; total: number }>();
    for (const cut of priced) {
      const current = grouped.get(cut.service) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += cut.price;
      grouped.set(cut.service, current);
    }
    const serviceTotal = priced.reduce((sum, cut) => sum + cut.price, 0);
    const policy = await this.db.lunchPolicy.findUnique({ where: { id: 'default' } });
    const percent = policy?.commissionPercent ?? 40;
    const orders = actor.role === 'admin'
      ? await this.db.order.aggregate({ where: { paymentStatus: 'paid', createdAt: { gte: localStart, lt: localEnd } }, _sum: { total: true } })
      : null;
    return {
      from,
      to,
      completedServices: priced.length,
      serviceTotal: Math.round(serviceTotal * 100) / 100,
      commission: Math.round(serviceTotal * percent) / 100,
      commissionPercent: percent,
      productTotal: orders?._sum.total ? decimalToNumber(orders._sum.total) : 0,
      services: [...grouped.entries()]
        .map(([name, value]) => ({ name, count: value.count, total: Math.round(value.total * 100) / 100 }))
        .sort((left, right) => right.total - left.total),
      cuts: priced,
    };
  }

  async clientCard(actor: Actor, userId: string) {
    assertRole(actor, ['admin', 'barber']);
    if (actor.role === 'barber') {
      const own = await this.ownBarber(actor);
      const related = await this.db.appointment.count({ where: { userId, barberId: own.id } });
      if (related === 0) throw new DomainError('FORBIDDEN', 'Ese cliente no tiene citas contigo.');
    }
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'client') throw new DomainError('NOT_FOUND', 'No encontramos ese cliente.');
    const visits = await this.db.appointment.findMany({
      where: { userId },
      include: { barber: true, barberService: true, services: { include: { service: true } } },
      orderBy: { startsAt: 'desc' },
      take: 8,
    });
    return {
      id: user.id,
      displayName: user.displayName,
      phone: user.phone,
      preferences: user.preferences,
      blocked: Boolean(user.blockedAt),
      blockReason: user.blockReason,
      noShowCount: user.noShowCount,
      visits: visits.map((visit) => ({
        id: visit.id,
        when: visit.startsAt.toISOString(),
        status: visit.status,
        barber: visit.barber.name,
        service: visit.barberService?.name ?? visit.services.map((line) => line.service.name).join(', '),
      })),
    };
  }

  async block(actor: Actor, userId: string, reason: string) {
    assertRole(actor, ['admin']);
    const user = await this.db.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'client') throw new DomainError('NOT_FOUND', 'No encontramos ese cliente.');
    await this.db.user.update({ where: { id: userId }, data: { blockedAt: new Date(), blockReason: reason } });
    await writeAudit(actor.id, 'client.block', userId);
    return { ok: true };
  }

  async unblock(actor: Actor, userId: string) {
    assertRole(actor, ['admin']);
    await this.db.user.update({ where: { id: userId }, data: { blockedAt: null, blockReason: null, noShowCount: 0 } });
    await writeAudit(actor.id, 'client.unblock', userId);
    return { ok: true };
  }

  async audit(actor: Actor) {
    assertRole(actor, ['superadmin']);
    const rows = await this.db.auditLog.findMany({
      include: { actor: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      at: row.createdAt.toISOString(),
      actor: row.actor.displayName,
      action: row.action,
      resource: row.resource,
    }));
  }

  async alerts(actor: Actor) {
    assertRole(actor, ['admin']);
    const rows = await this.db.stockAlert.findMany({
      where: { seen: false },
      include: { item: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return rows.map((row) => ({ id: row.id, name: row.item.name, stock: row.stock, at: row.createdAt.toISOString() }));
  }

  async seeAlert(actor: Actor, id: string) {
    assertRole(actor, ['admin']);
    await this.db.stockAlert.update({ where: { id }, data: { seen: true } });
    return { ok: true };
  }

  private async ownBarber(actor: Actor) {
    assertRole(actor, ['barber']);
    const barber = await this.barbers.findByUserId(actor.id);
    if (!barber) throw new DomainError('NOT_FOUND', 'No encontramos tu perfil de barbero.');
    return barber;
  }
}

