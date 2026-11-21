import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const GET = withActor(async (actor, _request, context) => {
  return json(await agendaController.listForBarber(actor, await routeParam(context, 'id')));
});
