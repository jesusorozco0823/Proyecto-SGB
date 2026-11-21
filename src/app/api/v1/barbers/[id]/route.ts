import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { barberController } from '@/server/modules/barbers';

export const PATCH = withActor(async (actor, request, context) => {
  const barber = await barberController.update(actor, await routeParam(context, 'id'), await readJson(request));
  return json(barber);
});

export const DELETE = withActor(async (actor, _request, context) => {
  await barberController.remove(actor, await routeParam(context, 'id'));
  return json({ ok: true });
});
