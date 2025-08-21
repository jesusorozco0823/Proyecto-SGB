'use server';

/**
 * @fileOverview Sentiment analysis flow for analyzing client feedback.
 *
 * - analyzeFeedbackSentiment - Analyzes feedback and classifies its sentiment.
 * - AnalyzeFeedbackSentimentInput - Input type for analyzeFeedbackSentiment.
 * - AnalyzeFeedbackSentimentOutput - Output type for analyzeFeedbackSentiment.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeFeedbackSentimentInputSchema = z.object({
  feedbackText: z.string().describe('The text of the feedback to analyze.'),
});
export type AnalyzeFeedbackSentimentInput = z.infer<typeof AnalyzeFeedbackSentimentInputSchema>;

const AnalyzeFeedbackSentimentOutputSchema = z.object({
  sentiment: z
    .enum(['positive', 'negative', 'neutral'])
    .describe('The sentiment of the feedback.'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe('The confidence level of the sentiment analysis (0 to 1).'),
});
export type AnalyzeFeedbackSentimentOutput = z.infer<typeof AnalyzeFeedbackSentimentOutputSchema>;

export async function analyzeFeedbackSentiment(
  input: AnalyzeFeedbackSentimentInput
): Promise<AnalyzeFeedbackSentimentOutput> {
  return analyzeFeedbackSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeFeedbackSentimentPrompt',
  input: {schema: AnalyzeFeedbackSentimentInputSchema},
  output: {schema: AnalyzeFeedbackSentimentOutputSchema},
  prompt: `Analiza el sentimiento del siguiente texto de opinión. Clasifícalo como positivo, negativo o neutral. Además, proporciona un nivel de confianza para tu análisis entre 0 y 1.

Texto de Opinión: {{{feedbackText}}}

Tu respuesta debe estar formateada como un objeto JSON con los campos "sentiment" y "confidence".
Asegúrate de que el sentimiento sea uno de "positive", "negative" o "neutral". La confianza debe ser un número entre 0 y 1.
`,
});

const analyzeFeedbackSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeFeedbackSentimentFlow',
    inputSchema: AnalyzeFeedbackSentimentInputSchema,
    outputSchema: AnalyzeFeedbackSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
