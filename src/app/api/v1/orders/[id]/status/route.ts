import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { orderController } from '@/server/modules/orders';

export const PATCH = withActor(async (actor, request, context) => {
  const order = await orderController.changeStatus(actor, await routeParam(context, 'id'), await readJson(request));
  return json(order);
});
