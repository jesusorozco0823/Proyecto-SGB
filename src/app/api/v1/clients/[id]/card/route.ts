import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const GET = withActor(async (actor, _request, context) => {
  return json(await salonController.clientCard(actor, await routeParam(context, 'id')));
});

export const POST = withActor(async (actor, request, context) => {
  return json(await salonController.block(actor, await routeParam(context, 'id'), await readJson(request)));
});

export const DELETE = withActor(async (actor, _request, context) => {
  return json(await salonController.unblock(actor, await routeParam(context, 'id')));
});
