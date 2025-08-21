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

{{#if (eq rating 5)}}
  // Calificación perfecta. Genera comentarios muy positivos y específicos.
  Ejemplos:
  - "¡El mejor corte que he tenido! {{{barberName}}} entendió exactamente lo que quería."
  - "Una experiencia increíble. El servicio de {{{serviceName}}} fue impecable y el ambiente del lugar es genial."
  - "{{{barberName}}} es un artista. Muy profesional y con gran atención al detalle."
{{else if (eq rating 4)}}
  // Calificación buena. Genera comentarios positivos con una pequeña área de mejora opcional.
  Ejemplos:
  - "Muy contento con mi {{{serviceName}}}. {{{barberName}}} hizo un gran trabajo. Volveré."
  - "El resultado fue excelente. Quizás el tiempo de espera fue un poco largo, pero valió la pena."
  - "Gran servicio y muy profesional. Me gustó mucho el resultado final."
{{else if (eq rating 3)}}
  // Calificación neutral. Genera comentarios que son equilibrados, mencionando algo bueno y algo a mejorar.
  Ejemplos:
  - "El corte estuvo bien, pero no fue exactamente lo que pedí. El barbero fue amable."
  - "El servicio fue correcto, aunque esperaba un poco más de atención al detalle."
  - "Una experiencia promedio. El resultado es aceptable, pero hay margen de mejora."
{{else}}
  // Calificación baja (1 o 2). Genera comentarios que son críticas constructivas y educadas.
  Ejemplos:
  - "No quedé satisfecho con el resultado. Me gustaría que se prestara más atención a las instrucciones del cliente."
  - "La experiencia no fue la esperada. Hubo problemas con [mencionar un aspecto específico como la puntualidad o el resultado]."
  - "Lamentablemente, el servicio no cumplió mis expectativas. Espero que este comentario ayude a mejorar."
{{/if}}

Genera tres opciones únicas y útiles para el cliente.
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
