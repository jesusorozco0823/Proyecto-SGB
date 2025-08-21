'use server';
/**
 * @fileOverview Recommends personalized services to clients based on their past history and preferences.
 *
 * - recommendPersonalizedServices - A function that handles the service recommendation process.
 * - RecommendPersonalizedServicesInput - The input type for the recommendPersonalizedServices function.
 * - RecommendPersonalizedServicesOutput - The return type for the recommendPersonalizedServices function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const RecommendPersonalizedServicesInputSchema = z.object({
  userId: z.string().describe('The ID of the user to recommend services for.'),
  userHistory: z.string().describe('The user history of appointments and purchases.'),
  userPreferences: z.string().describe('The user preferences for services and products.'),
});
export type RecommendPersonalizedServicesInput = z.infer<typeof RecommendPersonalizedServicesInputSchema>;

const RecommendPersonalizedServicesOutputSchema = z.object({
  recommendations: z.array(z.string()).describe('A list of recommended service names.'),
});
export type RecommendPersonalizedServicesOutput = z.infer<typeof RecommendPersonalizedServicesOutputSchema>;

export async function recommendPersonalizedServices(input: RecommendPersonalizedServicesInput): Promise<RecommendPersonalizedServicesOutput> {
  return recommendPersonalizedServicesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'recommendPersonalizedServicesPrompt',
  input: {schema: RecommendPersonalizedServicesInputSchema},
  output: {schema: RecommendPersonalizedServicesOutputSchema},
  prompt: `Eres un estilista personal que recomienda servicios personalizados a clientes basándose en su historial y preferencias.

  Historial del Usuario: {{{userHistory}}}
  Preferencias del Usuario: {{{userPreferences}}}

  Basándote en el historial y las preferencias del usuario, recomienda una lista de servicios que podrían interesarle. Devuelve solo una lista simple de nombres de servicios. Sin texto adicional.`,
});

const recommendPersonalizedServicesFlow = ai.defineFlow(
  {
    name: 'recommendPersonalizedServicesFlow',
    inputSchema: RecommendPersonalizedServicesInputSchema,
    outputSchema: RecommendPersonalizedServicesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
