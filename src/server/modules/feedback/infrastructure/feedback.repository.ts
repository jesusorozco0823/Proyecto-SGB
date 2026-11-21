import type { Prisma, PrismaClient } from '@prisma/client';
import type { FeedbackRepository, FeedbackView, SentimentResult } from '@/server/modules/feedback/application/ports';

const include = {
  appointment: { include: { client: true } },
} satisfies Prisma.FeedbackInclude;

type FeedbackRow = Prisma.FeedbackGetPayload<{ include: typeof include }>;

function toView(row: FeedbackRow): FeedbackView {
  return {
    id: row.id,
    appointmentId: row.appointmentId,
    rating: row.rating,
    comment: row.comment,
    sentiment: row.sentiment ?? undefined,
    user: {
      displayName: row.appointment.client.displayName,
      avatarUrl: row.appointment.client.avatarUrl ?? undefined,
    },
  };
}

export class PrismaFeedbackRepository implements FeedbackRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAppointment(id: string) {
    const appointment = await this.db.appointment.findUnique({
      where: { id },
      include: { feedback: { select: { id: true } } },
    });
    if (!appointment) return null;
    return {
      id: appointment.id,
      userId: appointment.userId,
      barberId: appointment.barberId,
      status: appointment.status,
      hasFeedback: Boolean(appointment.feedback),
    };
  }

  async save(input: {
    appointmentId: string;
    barberId: string;
    rating: number;
    comment: string;
    sentiment: SentimentResult | null;
  }) {
    const saved = await this.db.$transaction(async (tx) => {
      const feedback = await tx.feedback.create({
        data: {
          appointmentId: input.appointmentId,
          rating: input.rating,
          comment: input.comment,
          sentiment: input.sentiment?.sentiment,
          confidence: input.sentiment?.confidence,
        },
        include,
      });

      const average = await tx.feedback.aggregate({
        where: { appointment: { barberId: input.barberId } },
        _avg: { rating: true },
      });
      await tx.barber.update({
        where: { id: input.barberId },
        data: { rating: average._avg.rating ?? input.rating },
      });
      return feedback;
    });

    return toView(saved);
  }

  async listAll() {
    const rows = await this.db.feedback.findMany({ include, orderBy: { createdAt: 'desc' } });
    return rows.map(toView);
  }

  async listForBarber(userId: string) {
    const rows = await this.db.feedback.findMany({
      where: { appointment: { barber: { userId } } },
      include,
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(toView);
  }
}
