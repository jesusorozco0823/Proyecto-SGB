import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const PATCH = withActor(async (actor, request, context) => {
  const offering = await agendaController.updateOffering(actor, await routeParam(context, 'id'), await readJson(request));
  return json(offering);
});

export const DELETE = withActor(async (actor, _request, context) => {
  const offering = await agendaController.updateOffering(actor, await routeParam(context, 'id'), { active: false });
  return json(offering);
});
