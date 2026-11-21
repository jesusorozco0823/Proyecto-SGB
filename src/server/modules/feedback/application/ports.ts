import type { Feedback } from '@/lib/types';

export type FeedbackView = Feedback & {
  user: { displayName: string; avatarUrl?: string };
};

export type SentimentResult = {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
};

export interface SentimentAnalyzer {
  analyze(text: string): Promise<SentimentResult | null>;
}

export interface FeedbackRepository {
  findAppointment(id: string): Promise<{
    id: string;
    userId: string;
    barberId: string;
    status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
    hasFeedback: boolean;
  } | null>;
  save(input: {
    appointmentId: string;
    barberId: string;
    rating: number;
    comment: string;
    sentiment: SentimentResult | null;
  }): Promise<FeedbackView>;
  listAll(): Promise<FeedbackView[]>;
  listForBarber(userId: string): Promise<FeedbackView[]>;
}
