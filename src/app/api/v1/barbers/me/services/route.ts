import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const GET = withActor(async (actor) => json(await agendaController.listOwn(actor)));

export const POST = withActor(async (actor, request) => {
  const offering = await agendaController.createOffering(actor, await readJson(request));
  return json(offering, 201);
});
