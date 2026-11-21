import type { Actor } from '@/server/shared/auth/actor';
import { CacheTtl, cachedRead, invalidate } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import { writeAudit } from '@/server/shared/audit/write-audit';
import type { AppointmentRepository } from '@/server/modules/appointments/application/ports';

const CANCEL_WINDOW_MS = 2 * 60 * 60 * 1000;

export class AppointmentService {
  constructor(private readonly appointments: AppointmentRepository) {}

  list(actor: Actor) {
    const key = actor.role === 'admin' || actor.role === 'superadmin' ? 'appointments:staff' : `appointments:${actor.id}`;
    return cachedRead(key, CacheTtl.lists, async () => {
      if (actor.role === 'admin' || actor.role === 'superadmin') return this.appointments.listAll();
      if (actor.role === 'client') return this.appointments.listByClient(actor.id);
      if (actor.role === 'barber') return this.appointments.listByBarberUser(actor.id);
      throw new DomainError('FORBIDDEN', 'No tienes permiso para ver citas.');
    });
  }

  async create(actor: Actor, input: { userId?: string; barberId: string; barberServiceId: string; dayTurnId: string }) {
    const clientId = this.resolveClient(actor, input.userId);
    if (!(await this.appointments.userExists(clientId))) {
      throw new DomainError('NOT_FOUND', 'No encontramos al cliente.');
    }

    const turn = await this.appointments.findOpenTurn(input.dayTurnId);
    if (!turn || turn.barberId !== input.barberId || turn.status !== 'open') {
      throw new DomainError('APPOINTMENT_OVERLAP', 'Ese turno ya no está disponible.');
    }
    const offering = await this.appointments.findOffering(input.barberServiceId);
    if (!offering || !offering.active || offering.barberId !== input.barberId) {
      throw new DomainError('VALIDATION', 'Ese servicio no está disponible.');
    }
    const matches = turn.serviceId
      ? turn.serviceId === offering.id
      : turn.durationMinutes === offering.durationMinutes;
    if (!matches) {
      throw new DomainError('VALIDATION', 'Ese turno no corresponde al servicio elegido.');
    }

    const startsAt = atLocalMinutes(turn.date, turn.startMin);
    const endsAt = atLocalMinutes(turn.date, turn.endMin);
    if (startsAt.getTime() <= Date.now()) {
      throw new DomainError('INVALID_STATE', 'La cita debe ser en el futuro.');
    }
    const gate = await this.appointments.clientGate(clientId);
    if (gate.blocked) {
      throw new DomainError('FORBIDDEN', 'Esta cuenta no puede reservar. Habla con el salón.');
    }
    if (gate.activeAppointments >= 2) {
      throw new DomainError('INVALID_STATE', 'Ese cliente ya tiene 2 citas activas.');
    }
    const deposit = await this.appointments.depositAmount();

    const booked = await this.appointments.bookTurn({
      userId: clientId,
      barberId: input.barberId,
      dayTurnId: turn.id,
      barberServiceId: offering.id,
      startsAt,
      endsAt,
      depositStatus: deposit > 0 ? 'pending' : 'waived',
      depositAmount: deposit,
    });
    await writeAudit(actor.id, 'appointment.book', booked.id);
    if (actor.role === 'client') {
      const when = new Date(booked.datetime);
      try {
        await this.appointments.tellBarber({
          barberUserId: booked.barber.userId,
          clientId: booked.userId,
          clientName: booked.client.displayName,
          serviceName: booked.services[0]?.name ?? 'un servicio',
          whenLabel: when.toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
        });
      } catch {
        // La cita ya quedó guardada. El aviso del chat no debe deshacerla.
      }
    }
    this.changed();
    return booked;
  }

  async cancel(actor: Actor, id: string, reason: string, options?: { skipWindow?: boolean }) {
    const appointment = await this.require(id);
    const isOwner = actor.role === 'client' && appointment.userId === actor.id;
    if (!isOwner && actor.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'No puedes cancelar esta cita.');
    }
    if (appointment.status !== 'scheduled') {
      throw new DomainError('INVALID_STATE', 'Solo se pueden cancelar citas programadas.');
    }
    if (!options?.skipWindow && isOwner && new Date(appointment.datetime).getTime() - Date.now() < CANCEL_WINDOW_MS) {
      throw new DomainError('INVALID_STATE', 'Solo puedes cancelar con al menos 2 horas de anticipación.');
    }
    const cancelled = await this.appointments.markCancelled(id, reason);
    const when = new Date(appointment.datetime);
    const day = calendarDay(when);
    const dateKey = `${day.getUTCFullYear()}-${String(day.getUTCMonth() + 1).padStart(2, '0')}-${String(day.getUTCDate()).padStart(2, '0')}`;
    await this.appointments.offerFreedTurn({
      barberId: appointment.barberId,
      barberUserId: appointment.barber.userId,
      serviceId: appointment.serviceIds[0] ?? null,
      date: day,
      dateKey,
      whenLabel: when.toLocaleString('es-CO', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }),
      serviceName: appointment.services[0]?.name ?? 'tu servicio',
      excludeUserId: appointment.userId,
    });
    await writeAudit(actor.id, 'appointment.cancel', id);
    this.changed();
    return cancelled;
  }

  async noShow(actor: Actor, id: string) {
    const appointment = await this.require(id);
    const isAssignedBarber = actor.role === 'barber' && appointment.barber.userId === actor.id;
    if (!isAssignedBarber && actor.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'No puedes marcar esta inasistencia.');
    }
    if (appointment.status !== 'scheduled') {
      throw new DomainError('INVALID_STATE', 'Solo una cita programada puede quedar como inasistencia.');
    }
    const updated = await this.appointments.markNoShow(id);
    await writeAudit(actor.id, 'appointment.no_show', id);
    this.changed();
    return updated;
  }

  async answer(actor: Actor, id: string, answer: 'confirmed' | 'declined') {
    const appointment = await this.require(id);
    if (actor.role !== 'client' || appointment.userId !== actor.id) {
      throw new DomainError('FORBIDDEN', 'Solo el cliente confirma si va.');
    }
    if (appointment.status !== 'scheduled') {
      throw new DomainError('INVALID_STATE', 'Esta cita ya no está programada.');
    }
    if (new Date(appointment.datetime).getTime() <= Date.now()) {
      throw new DomainError('INVALID_STATE', 'Esa cita ya pasó.');
    }
    if (answer === 'declined') {
      await this.appointments.markAttendance(id, 'declined');
      return this.cancel(actor, id, 'El cliente avisó que no va.', { skipWindow: true });
    }
    const updated = await this.appointments.markAttendance(id, 'confirmed');
    this.changed();
    return updated;
  }

  async confirmDeposit(actor: Actor, id: string) {
    if (actor.role !== 'admin') throw new DomainError('FORBIDDEN', 'Solo un administrador confirma el abono.');
    const appointment = await this.require(id);
    if (appointment.depositStatus !== 'pending') {
      throw new DomainError('INVALID_STATE', 'Esta cita no tiene un abono pendiente.');
    }
    const updated = await this.appointments.markDepositPaid(id);
    await writeAudit(actor.id, 'appointment.deposit', id);
    this.changed();
    return updated;
  }

  async receipt(actor: Actor, id: string) {
    const appointment = await this.require(id);
    const isOwner = actor.role === 'client' && appointment.userId === actor.id;
    const isAssignedBarber = actor.role === 'barber' && appointment.barber.userId === actor.id;
    if (!isOwner && !isAssignedBarber && actor.role !== 'admin' && actor.role !== 'superadmin') {
      throw new DomainError('FORBIDDEN', 'No puedes ver este comprobante.');
    }
    return {
      kind: 'appointment' as const,
      id: appointment.id,
      when: appointment.datetime,
      client: appointment.client.displayName,
      barber: appointment.barber.name,
      services: appointment.services.map((service) => ({ name: service.name, price: service.price })),
      depositStatus: appointment.depositStatus,
      depositAmount: appointment.depositAmount,
      status: appointment.status,
    };
  }

  async complete(actor: Actor, id: string) {
    const appointment = await this.require(id);
    const isAssignedBarber = actor.role === 'barber' && appointment.barber.userId === actor.id;
    if (!isAssignedBarber && actor.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'No puedes completar esta cita.');
    }
    if (appointment.status !== 'scheduled') {
      throw new DomainError('INVALID_STATE', 'Solo se pueden completar citas programadas.');
    }
    const completed = await this.appointments.markCompleted(id);
    this.changed();
    return completed;
  }

  private changed() {
    invalidate('appointments:', 'stats:', 'cash:', 'messages:');
  }

  private resolveClient(actor: Actor, userId?: string) {
    if (actor.role === 'client') return actor.id;
    if (actor.role === 'admin') {
      if (!userId) throw new DomainError('VALIDATION', 'Indica el cliente de la cita.');
      return userId;
    }
    throw new DomainError('FORBIDDEN', 'No puedes crear citas.');
  }

  private async require(id: string) {
    const appointment = await this.appointments.findById(id);
    if (!appointment) throw new DomainError('NOT_FOUND', 'No encontramos la cita.');
    return appointment;
  }
}

function calendarDay(value: Date) {
  return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
}

function atLocalMinutes(day: Date, minutes: number) {
  const date = new Date(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate());
  date.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return date;
}
