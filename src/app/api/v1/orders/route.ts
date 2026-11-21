import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { orderController } from '@/server/modules/orders';

export const GET = withActor(async (actor) => json(await orderController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const order = await orderController.place(actor, await readJson(request));
  return json(order, 201);
});
