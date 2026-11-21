import type { Actor } from '@/server/shared/auth/actor';
import { invalidate } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { FeedbackRepository, SentimentAnalyzer } from '@/server/modules/feedback/application/ports';

export class FeedbackService {
  constructor(
    private readonly feedback: FeedbackRepository,
    private readonly sentiment: SentimentAnalyzer,
  ) {}

  async create(actor: Actor, appointmentId: string, input: { rating: number; comment: string }) {
    if (actor.role !== 'client') {
      throw new DomainError('FORBIDDEN', 'Solo el cliente puede dejar una opinión.');
    }

    const appointment = await this.feedback.findAppointment(appointmentId);
    if (!appointment) throw new DomainError('NOT_FOUND', 'No encontramos la cita.');
    if (appointment.userId !== actor.id) {
      throw new DomainError('FORBIDDEN', 'Esta cita no es tuya.');
    }
    if (appointment.status !== 'completed') {
      throw new DomainError('INVALID_STATE', 'Solo puedes opinar sobre una cita completada.');
    }
    if (appointment.hasFeedback) {
      throw new DomainError('INVALID_STATE', 'Esta cita ya tiene una opinión.');
    }

    const sentiment = await this.sentiment.analyze(input.comment);
    const saved = await this.feedback.save({
      appointmentId,
      barberId: appointment.barberId,
      rating: input.rating,
      comment: input.comment,
      sentiment,
    });
    invalidate('appointments:');
    return saved;
  }

  list(actor: Actor) {
    if (actor.role === 'admin' || actor.role === 'superadmin') return this.feedback.listAll();
    if (actor.role === 'barber') return this.feedback.listForBarber(actor.id);
    throw new DomainError('FORBIDDEN', 'No tienes permiso para ver las opiniones.');
  }
}
