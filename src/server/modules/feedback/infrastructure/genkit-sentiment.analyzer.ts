import type { SentimentAnalyzer, SentimentResult } from '@/server/modules/feedback/application/ports';

export class GenkitSentimentAnalyzer implements SentimentAnalyzer {
  async analyze(text: string): Promise<SentimentResult | null> {
    try {
      const { analyzeFeedbackSentiment } = await import('@/ai/flows/analyze-feedback-sentiment');
      return await analyzeFeedbackSentiment({ feedbackText: text });
    } catch (error) {
      console.error('No se pudo analizar el sentimiento de la opinión.', error);
      return null;
    }
  }
}
