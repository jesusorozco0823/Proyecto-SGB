import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { CreditService } from '@/server/modules/credits/application/credit.service';

const askSchema = z.object({
  barberId: z.string().min(1, 'Elige un barbero.'),
  kind: z.enum(['owed', 'prepaid']),
  note: z.string().trim().max(240, 'La nota admite 240 caracteres.').optional().default(''),
});

const barberSchema = z.object({
  answer: z.enum(['accepted', 'rejected']),
});

const decideSchema = z.object({
  answer: z.enum(['approved', 'rejected']),
  kind: z.enum(['owed', 'prepaid']).optional(),
  measure: z.enum(['cuts', 'budget']).optional(),
  limit: z.number().int().positive().optional(),
});

const chargeSchema = z.object({
  appointmentId: z.string().min(1, 'Elige la cita.'),
});

export class CreditController {
  constructor(private readonly credits: CreditService) {}

  list(actor: Actor) {
    return this.credits.list(actor);
  }

  ask(actor: Actor, input: unknown) {
    const parsed = askSchema.parse(input);
    return this.credits.ask(actor, { barberId: parsed.barberId, kind: parsed.kind, note: parsed.note || null });
  }

  barberAnswer(actor: Actor, id: string, input: unknown) {
    return this.credits.barberAnswer(actor, id, barberSchema.parse(input).answer);
  }

  decide(actor: Actor, id: string, input: unknown) {
    return this.credits.adminDecide(actor, id, decideSchema.parse(input));
  }

  charge(actor: Actor, id: string, input: unknown) {
    return this.credits.charge(actor, id, chargeSchema.parse(input).appointmentId);
  }

  close(actor: Actor, id: string) {
    return this.credits.close(actor, id);
  }
}
