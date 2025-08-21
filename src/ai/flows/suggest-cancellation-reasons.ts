'use server';
/**
 * @fileOverview Sugiere motivos de cancelación para citas.
 *
 * - suggestCancellationReasons - Una función que genera motivos de cancelación.
 * - SuggestCancellationReasonsOutput - El tipo de retorno para la función suggestCancellationReasons.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCancellationReasonsOutputSchema = z.object({
  reasons: z.array(z.string()).describe('Una lista de 3 motivos de cancelación sugeridos.'),
});
export type SuggestCancellationReasonsOutput = z.infer<typeof SuggestCancellationReasonsOutputSchema>;

export async function suggestCancellationReasons(): Promise<SuggestCancellationReasonsOutput> {
  return suggestCancellationReasonsFlow();
}

const prompt = ai.definePrompt({
  name: 'suggestCancellationReasonsPrompt',
  output: {schema: SuggestCancellationReasonsOutputSchema},
  prompt: `Eres un asistente para una barbería. Genera 3 motivos de cancelación cortos y comunes para una cita. Los motivos deben ser concisos y educados. Por ejemplo: "Conflicto de horario", "Emergencia personal", "Ya no necesito la cita".`,
});

const suggestCancellationReasonsFlow = ai.defineFlow(
  {
    name: 'suggestCancellationReasonsFlow',
    outputSchema: SuggestCancellationReasonsOutputSchema,
  },
  async () => {
    const {output} = await prompt({});
    return output!;
  }
);
