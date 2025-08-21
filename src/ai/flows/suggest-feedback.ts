'use server';
/**
 * @fileOverview Sugiere comentarios de opinión para citas.
 *
 * - suggestFeedback - Una función que genera sugerencias de comentarios.
 * - SuggestFeedbackInput - El tipo de entrada para la función suggestFeedback.
 * - SuggestFeedbackOutput - El tipo de retorno para la función suggestFeedback.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFeedbackInputSchema = z.object({
  rating: z.number().min(1).max(5).describe('La calificación de estrellas dada por el cliente (1-5).'),
  serviceName: z.string().describe('El nombre del servicio recibido.'),
  barberName: z.string().describe('El nombre del barbero que realizó el servicio.'),
});
export type SuggestFeedbackInput = z.infer<typeof SuggestFeedbackInputSchema>;


const SuggestFeedbackOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('Una lista de 3 sugerencias de comentarios.'),
});
export type SuggestFeedbackOutput = z.infer<typeof SuggestFeedbackOutputSchema>;

export async function suggestFeedback(input: SuggestFeedbackInput): Promise<SuggestFeedbackOutput> {
  return suggestFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFeedbackPrompt',
  input: {schema: SuggestFeedbackInputSchema},
  output: {schema: SuggestFeedbackOutputSchema},
  prompt: `Eres un asistente para una barbería. Un cliente ha calificado un servicio y necesita ayuda para escribir un comentario.

Detalles de la Cita:
- Servicio: {{{serviceName}}}
- Barbero: {{{barberName}}}
- Calificación: {{{rating}}} de 5 estrellas

Basado en la calificación, genera 3 sugerencias de comentarios distintas.

- Si la calificación es 5/5, genera comentarios muy positivos y específicos sobre el excelente trabajo de {{{barberName}}} y la calidad del servicio {{{serviceName}}}.
- Si la calificación es 4/5, genera comentarios positivos, mencionando que el servicio fue muy bueno pero quizás con una pequeña sugerencia opcional.
- Si la calificación es 3/5, genera comentarios neutrales, mencionando un aspecto positivo y uno que podría mejorar, de forma equilibrada.
- Si la calificación es 1/5 o 2/5, genera comentarios que sean críticas constructivas, educadas y específicas sobre lo que no cumplió las expectativas, para ayudar al negocio a mejorar.

Genera tres opciones únicas y útiles para el cliente. No incluyas viñetas ni numeración en tu respuesta.
`,
});

const suggestFeedbackFlow = ai.defineFlow(
  {
    name: 'suggestFeedbackFlow',
    inputSchema: SuggestFeedbackInputSchema,
    outputSchema: SuggestFeedbackOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
