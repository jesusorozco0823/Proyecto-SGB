import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { FeedbackService } from '@/server/modules/feedback/application/feedback.service';

const createSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(1, 'Escribe un comentario').max(500, 'La opinión admite 500 caracteres'),
});

export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  create(actor: Actor, appointmentId: string, input: unknown) {
    return this.feedback.create(actor, appointmentId, createSchema.parse(input));
  }

  list(actor: Actor) {
    return this.feedback.list(actor);
  }
}
