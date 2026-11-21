import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { orderController } from '@/server/modules/orders';

export const POST = withActor(async (actor, _request, context) => {
  return json(await orderController.confirmPayment(actor, await routeParam(context, 'id')));
});
