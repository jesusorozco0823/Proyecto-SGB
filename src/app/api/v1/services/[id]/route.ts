import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { catalogController } from '@/server/modules/catalog';

export const PATCH = withActor(async (actor, request, context) => {
  const service = await catalogController.update(actor, await routeParam(context, 'id'), await readJson(request));
  return json(service);
});

export const DELETE = withActor(async (actor, _request, context) => {
  await catalogController.remove(actor, await routeParam(context, 'id'));
  return json({ ok: true });
});
