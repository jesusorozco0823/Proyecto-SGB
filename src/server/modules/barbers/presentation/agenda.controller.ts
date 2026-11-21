import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { AgendaService, presentPreview, type AgendaRequest } from '@/server/modules/barbers/application/agenda.service';

const countSchema = z.object({
  serviceId: z.string().min(1),
  count: z.number().int().min(0),
});

const agendaSchema = z.object({
  open: z.string().min(1, 'Indica la hora de apertura'),
  close: z.string().min(1, 'Indica la hora de cierre'),
  lunchStart: z.string().min(1, 'Indica el inicio del almuerzo'),
  serviceIds: z.array(z.string().min(1)).min(1, 'Elige al menos un servicio'),
  counts: z.array(countSchema).default([]),
  specialStart: z.string().min(1).optional(),
  specialStarts: z.array(z.object({
    serviceId: z.string().min(1),
    start: z.string().min(1),
  })).optional(),
  extraServiceId: z.string().min(1).optional(),
});

const saveSchema = agendaSchema.extend({
  weekdays: z.array(z.number().int().min(0).max(6)).min(1, 'Elige al menos un día'),
});

const offeringSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre del servicio'),
  durationMinutes: z.number().int().positive('La duración debe ser mayor a cero'),
  price: z.number().nonnegative('El precio no puede ser negativo').default(0),
  description: z.string().trim().optional(),
  isSpecial: z.boolean().default(false),
});

const lunchSchema = z.object({
  durationMinutes: z.number().int(),
});

export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  lunch(actor: Actor) {
    return this.agenda.lunch(actor);
  }

  updateLunch(actor: Actor, input: unknown) {
    return this.agenda.updateLunch(actor, lunchSchema.parse(input).durationMinutes);
  }

  listOwn(actor: Actor) {
    return this.agenda.listOwnOfferings(actor);
  }

  listForBarber(actor: Actor, barberId: string) {
    return this.agenda.listOfferings(actor, barberId);
  }

  createOffering(actor: Actor, input: unknown) {
    const data = offeringSchema.parse(input);
    return this.agenda.createOffering(actor, {
      name: data.name,
      durationMinutes: data.durationMinutes,
      price: data.price,
      description: data.description || null,
      isSpecial: data.isSpecial,
    });
  }

  updateOffering(actor: Actor, id: string, input: unknown) {
    const data = offeringSchema.partial().extend({ active: z.boolean().optional() }).parse(input);
    return this.agenda.updateOffering(actor, id, {
      ...data,
      description: data.description === undefined ? undefined : data.description || null,
    });
  }

  preview(actor: Actor, input: unknown) {
    return this.agenda.preview(actor, agendaSchema.parse(input) as AgendaRequest).then(presentPreview);
  }

  save(actor: Actor, input: unknown) {
    return this.agenda.save(actor, saveSchema.parse(input));
  }

  openDays(actor: Actor) {
    return this.agenda.openDays(actor);
  }

  addTurn(actor: Actor, input: unknown) {
    const data = z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha no es válida.'),
      start: z.string().min(1, 'Indica la hora'),
      serviceId: z.string().min(1, 'Elige el servicio'),
    }).parse(input);
    return this.agenda.addTurn(actor, data);
  }

  removeTurn(actor: Actor, id: string) {
    return this.agenda.removeTurn(actor, id);
  }

  turns(actor: Actor, barberId: string, date: string | null, serviceId: string | null) {
    if (!date || !serviceId) {
      throw new DomainError('VALIDATION', 'Indica la fecha y el servicio.');
    }
    return this.agenda.turns(actor, barberId, date, serviceId);
  }
}
