import type { Prisma, PrismaClient } from '@prisma/client';
import type { Service } from '@/lib/types';
import { invalidate } from '@/server/shared/cache/read-cache';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { AppointmentRepository, AppointmentView } from '@/server/modules/appointments/application/ports';

const include = {
  client: true,
  barber: true,
  feedback: true,
  barberService: true,
  services: { include: { service: true } },
} satisfies Prisma.AppointmentInclude;

type AppointmentRow = Prisma.AppointmentGetPayload<{ include: typeof include }>;

function toView(appointment: AppointmentRow): AppointmentView {
  return {
    id: appointment.id,
    userId: appointment.userId,
    barberId: appointment.barberId,
    serviceIds: appointment.barberService ? [appointment.barberService.id] : appointment.services.map((line) => line.serviceId),
    datetime: appointment.startsAt.toISOString(),
    status: appointment.status,
    attendance: appointment.attendance,
    cancellationReason: appointment.cancellationReason ?? undefined,
    depositStatus: appointment.depositStatus,
    depositAmount: decimalToNumber(appointment.depositAmount),
    rating: appointment.feedback?.rating,
    comment: appointment.feedback?.comment,
    client: {
      id: appointment.client.id,
      displayName: appointment.client.displayName,
      avatarUrl: appointment.client.avatarUrl ?? undefined,
    },
    barber: {
      id: appointment.barber.id,
      name: appointment.barber.name,
      userId: appointment.barber.userId,
    },
    services: appointment.barberService
      ? [{
          id: appointment.barberService.id,
          name: appointment.barberService.name,
          duration: appointment.barberService.durationMinutes,
          price: decimalToNumber(appointment.barberService.price),
          description: appointment.barberService.description ?? '',
        }]
      : appointment.services.map((line) => ({
          id: line.service.id,
          name: line.service.name,
          duration: line.duration,
          price: decimalToNumber(line.price),
          description: line.service.description,
        })),
  };
}

export class PrismaAppointmentRepository implements AppointmentRepository {
  constructor(private readonly db: PrismaClient) {}

  listAll() {
    return this.list({});
  }

  listByClient(userId: string) {
    return this.list({ userId });
  }

  listByBarberUser(userId: string) {
    return this.list({ barber: { userId } });
  }

  async findById(id: string) {
    const appointment = await this.db.appointment.findUnique({ where: { id }, include });
    return appointment ? toView(appointment) : null;
  }

  async userExists(id: string) {
    const user = await this.db.user.findUnique({ where: { id }, select: { id: true } });
    return Boolean(user);
  }

  async findBarber(id: string) {
    const barber = await this.db.barber.findUnique({
      where: { id },
      include: { schedules: true },
    });
    if (!barber) return null;
    return {
      id: barber.id,
      userId: barber.userId,
      rows: barber.schedules.map((row) => ({
        dayOfWeek: row.dayOfWeek,
        startMin: row.startMin,
        endMin: row.endMin,
      })),
    };
  }

  async findActiveServices(ids: string[]): Promise<Service[]> {
    const services = await this.db.service.findMany({ where: { id: { in: ids }, active: true } });
    return services.map((service) => ({
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: decimalToNumber(service.price),
      description: service.description,
    }));
  }

  async findOpenTurn(id: string) {
    const turn = await this.db.dayTurn.findUnique({ where: { id } });
    if (!turn) return null;
    return {
      id: turn.id,
      barberId: turn.barberId,
      date: turn.date,
      startMin: turn.startMin,
      endMin: turn.endMin,
      durationMinutes: turn.durationMinutes,
      serviceId: turn.serviceId,
      status: turn.status,
    };
  }

  async findOffering(id: string) {
    const offering = await this.db.barberService.findUnique({ where: { id } });
    if (!offering) return null;
    return {
      id: offering.id,
      barberId: offering.barberId,
      name: offering.name,
      durationMinutes: offering.durationMinutes,
      price: decimalToNumber(offering.price),
      active: offering.active,
    };
  }

  async clientGate(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { blockedAt: true } });
    const activeAppointments = await this.db.appointment.count({
      where: { userId, status: 'scheduled', startsAt: { gt: new Date() } },
    });
    return { blocked: Boolean(user?.blockedAt), activeAppointments };
  }

  async depositAmount() {
    const policy = await this.db.lunchPolicy.findUnique({ where: { id: 'default' } });
    return policy ? decimalToNumber(policy.depositAmount) : 0;
  }

  async bookTurn(input: { userId: string; barberId: string; dayTurnId: string; barberServiceId: string; startsAt: Date; endsAt: Date; depositStatus: 'waived' | 'pending'; depositAmount: number }) {
    const created = await this.db.$transaction(async (tx) => {
      const claimed = await tx.dayTurn.updateMany({
        where: { id: input.dayTurnId, barberId: input.barberId, status: 'open' },
        data: { status: 'booked' },
      });
      if (claimed.count !== 1) {
        throw new DomainError('APPOINTMENT_OVERLAP', 'Ese turno ya no está disponible.');
      }
      return tx.appointment.create({
        data: {
          userId: input.userId,
          barberId: input.barberId,
          barberServiceId: input.barberServiceId,
          dayTurnId: input.dayTurnId,
          startsAt: input.startsAt,
          endsAt: input.endsAt,
          depositStatus: input.depositStatus,
          depositAmount: input.depositAmount,
        },
        include,
      });
    });
    return toView(created);
  }

  async markCancelled(id: string, reason: string) {
    const appointment = await this.db.$transaction(async (tx) => {
      const current = await tx.appointment.update({
        where: { id },
        data: { status: 'cancelled', cancellationReason: reason },
        include,
      });
      if (current.dayTurnId) {
        await tx.dayTurn.update({
          where: { id: current.dayTurnId },
          data: { status: 'open' },
        });
      }
      return current;
    });
    return toView(appointment);
  }

  async markNoShow(id: string) {
    const appointment = await this.db.$transaction(async (tx) => {
      const current = await tx.appointment.update({
        where: { id },
        data: { status: 'no_show' },
        include,
      });
      const user = await tx.user.update({
        where: { id: current.userId },
        data: { noShowCount: { increment: 1 } },
      });
      if (user.noShowCount >= 3 && !user.blockedAt) {
        await tx.user.update({
          where: { id: user.id },
          data: { blockedAt: new Date(), blockReason: 'Tres inasistencias.' },
        });
      }
      return current;
    });
    return toView(appointment);
  }

  async markDepositPaid(id: string) {
    const appointment = await this.db.appointment.update({
      where: { id },
      data: { depositStatus: 'paid' },
      include,
    });
    return toView(appointment);
  }

  async markAttendance(id: string, attendance: 'pending' | 'confirmed' | 'declined') {
    const appointment = await this.db.appointment.update({
      where: { id },
      data: { attendance },
      include,
    });
    return toView(appointment);
  }

  async tellBarber(input: { barberUserId: string; clientId: string; clientName: string; serviceName: string; whenLabel: string }) {
    if (input.barberUserId === input.clientId) return;
    const body = `${input.clientName} apartó ${input.serviceName} para el ${input.whenLabel}.`.slice(0, 500);
    await this.db.message.create({ data: { senderId: input.clientId, recipientId: input.barberUserId, body } });
    invalidate(`messages:${input.clientId}:`, `messages:${input.barberUserId}:`);
  }

  async sendDueReminders() {
    const now = new Date();
    const until = new Date(now.getTime() + 30 * 60 * 1000);
    const due = await this.db.appointment.findMany({
      where: { status: 'scheduled', remindedAt: null, startsAt: { gt: now, lte: until } },
      include: { barber: true, barberService: true },
      orderBy: { startsAt: 'asc' },
      take: 20,
    });
    for (const row of due) {
      if (row.barber.userId === row.userId) continue;
      const time = row.startsAt.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
      const service = row.barberService?.name ?? 'tu cita';
      const body = `Tu cita de ${service} es a las ${time}. Te escribimos media hora antes para que alcances a llegar.`.slice(0, 500);
      await this.db.$transaction(async (tx) => {
        const claimed = await tx.appointment.updateMany({
          where: { id: row.id, remindedAt: null, status: 'scheduled' },
          data: { remindedAt: new Date() },
        });
        if (claimed.count !== 1) return;
        await tx.message.create({ data: { senderId: row.barber.userId, recipientId: row.userId, body } });
      });
      invalidate(`messages:${row.userId}:`, `messages:${row.barber.userId}:`);
    }
  }

  async offerFreedTurn(input: {
    barberId: string;
    barberUserId: string;
    serviceId: string | null;
    date: Date;
    dateKey: string;
    whenLabel: string;
    serviceName: string;
    excludeUserId: string;
  }) {
    if (!input.serviceId || input.barberUserId === input.excludeUserId) return;
    const entry = await this.db.waitlistEntry.findFirst({
      where: {
        barberId: input.barberId,
        serviceId: input.serviceId,
        date: input.date,
        status: 'waiting',
        userId: { not: input.excludeUserId },
      },
      orderBy: { createdAt: 'asc' },
    });
    if (!entry) return;
    const path = `/dashboard/book?barber=${input.barberId}&service=${input.serviceId}&date=${input.dateKey}`;
    const sentence = `Se liberó un turno de ${input.serviceName} el ${input.whenLabel}. Tómalo si todavía te sirve.`;
    const body = `${sentence.slice(0, 499 - path.length)}\n${path}`;
    await this.db.message.create({ data: { senderId: input.barberUserId, recipientId: entry.userId, body } });
    await this.db.waitlistEntry.update({ where: { id: entry.id }, data: { status: 'notified' } });
  }

  async markCompleted(id: string) {
    const appointment = await this.db.appointment.update({
      where: { id },
      data: { status: 'completed' },
      include,
    });
    return toView(appointment);
  }

  private async list(where: Prisma.AppointmentWhereInput) {
    const rows = await this.db.appointment.findMany({
      where,
      include,
      orderBy: { startsAt: 'desc' },
    });
    return rows.map(toView);
  }
}
