import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { creditController } from '@/server/modules/credits';

export const POST = withActor(async (actor, _request, context) => {
  const credit = await creditController.close(actor, await routeParam(context, 'id'));
  return json(credit);
});
