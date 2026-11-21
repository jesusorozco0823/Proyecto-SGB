import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import type { WeekSchedule } from '@/server/shared/time/schedule-time';
import { BarberService } from '@/server/modules/barbers/application/barber.service';

const windowSchema = z.object({ start: z.string().min(1), end: z.string().min(1) }).nullable();

const scheduleSchema = z.object({
  sunday: windowSchema,
  monday: windowSchema,
  tuesday: windowSchema,
  wednesday: windowSchema,
  thursday: windowSchema,
  friday: windowSchema,
  saturday: windowSchema,
});

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre'),
  documentNumber: z.string().trim().min(5, 'El documento es demasiado corto'),
  phone: z.string().trim().min(7, 'Escribe un teléfono válido'),
  skills: z.array(z.string().trim().min(1)).min(1, 'Indica al menos una habilidad'),
  imageUrl: z.string().trim().optional(),
});

const createSchema = profileSchema.extend({
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const DEFAULT_IMAGE = 'https://placehold.co/400x400.png';

export class BarberController {
  constructor(private readonly barbers: BarberService) {}

  list(actor: Actor) {
    return this.barbers.list(actor);
  }

  own(actor: Actor) {
    return this.barbers.own(actor);
  }

  create(actor: Actor, input: unknown) {
    const data = createSchema.parse(input);
    return this.barbers.create(actor, {
      name: data.name,
      documentNumber: data.documentNumber,
      phone: data.phone,
      password: data.password,
      skills: data.skills,
      imageUrl: data.imageUrl || DEFAULT_IMAGE,
    });
  }

  update(actor: Actor, id: string, input: unknown) {
    const data = profileSchema.parse(input);
    return this.barbers.update(actor, id, {
      name: data.name,
      documentNumber: data.documentNumber,
      phone: data.phone,
      skills: data.skills,
      imageUrl: data.imageUrl || DEFAULT_IMAGE,
    });
  }

  replaceSchedule(actor: Actor, id: string, input: unknown) {
    return this.barbers.replaceSchedule(actor, id, scheduleSchema.parse(input) as WeekSchedule);
  }

  replaceOwnSchedule(actor: Actor, input: unknown) {
    return this.barbers.replaceOwnSchedule(actor, scheduleSchema.parse(input) as WeekSchedule);
  }

  remove(actor: Actor, id: string) {
    return this.barbers.remove(actor, id);
  }

  resetPassword(actor: Actor, id: string, input: unknown) {
    const password = z.object({ password: z.string().min(8).max(72) }).parse(input).password;
    return this.barbers.resetPassword(actor, id, password);
  }

  availability(actor: Actor, id: string, date: string | null, duration: string | null) {
    const parsed = z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe tener formato AAAA-MM-DD'),
        duration: z.coerce.number().int().positive('La duración debe ser mayor a cero'),
      })
      .parse({ date, duration });
    return this.barbers.availability(actor, id, parsed.date, parsed.duration);
  }
}
