import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const GET = withActor(async (actor, request, context) => {
  const url = new URL(request.url);
  const agenda = await agendaController.turns(
    actor,
    await routeParam(context, 'id'),
    url.searchParams.get('date'),
    url.searchParams.get('serviceId'),
  );
  return json(agenda);
});
