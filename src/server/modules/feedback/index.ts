import { prisma } from '@/server/shared/database/prisma';
import { PrismaFeedbackRepository } from '@/server/modules/feedback/infrastructure/feedback.repository';
import { GenkitSentimentAnalyzer } from '@/server/modules/feedback/infrastructure/genkit-sentiment.analyzer';
import { FeedbackService } from '@/server/modules/feedback/application/feedback.service';
import { FeedbackController } from '@/server/modules/feedback/presentation/feedback.controller';

export const feedbackController = new FeedbackController(
  new FeedbackService(new PrismaFeedbackRepository(prisma), new GenkitSentimentAnalyzer()),
);
