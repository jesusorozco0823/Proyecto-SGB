import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { AppointmentService } from '@/server/modules/appointments/application/appointment.service';

const createSchema = z.object({
  userId: z.string().min(1).optional(),
  barberId: z.string().min(1, 'Selecciona un barbero'),
  barberServiceId: z.string().min(1, 'Selecciona un servicio'),
  dayTurnId: z.string().min(1, 'Selecciona un turno'),
});

const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'Indica un motivo de cancelación'),
});

const attendanceSchema = z.object({
  answer: z.enum(['confirmed', 'declined']),
});

export class AppointmentController {
  constructor(private readonly appointments: AppointmentService) {}

  list(actor: Actor) {
    return this.appointments.list(actor);
  }

  create(actor: Actor, input: unknown) {
    return this.appointments.create(actor, createSchema.parse(input));
  }

  cancel(actor: Actor, id: string, input: unknown) {
    return this.appointments.cancel(actor, id, reasonSchema.parse(input).reason);
  }

  complete(actor: Actor, id: string) {
    return this.appointments.complete(actor, id);
  }

  noShow(actor: Actor, id: string) {
    return this.appointments.noShow(actor, id);
  }

  answer(actor: Actor, id: string, input: unknown) {
    return this.appointments.answer(actor, id, attendanceSchema.parse(input).answer);
  }

  confirmDeposit(actor: Actor, id: string) {
    return this.appointments.confirmDeposit(actor, id);
  }

  receipt(actor: Actor, id: string) {
    return this.appointments.receipt(actor, id);
  }
}
