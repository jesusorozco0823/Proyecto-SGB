import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { inventoryController } from '@/server/modules/inventory';

export const PATCH = withActor(async (actor, request, context) => {
  const item = await inventoryController.update(actor, await routeParam(context, 'id'), await readJson(request));
  return json(item);
});

export const DELETE = withActor(async (actor, _request, context) => {
  await inventoryController.remove(actor, await routeParam(context, 'id'));
  return json({ ok: true });
});
