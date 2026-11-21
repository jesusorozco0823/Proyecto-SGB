import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { creditController } from '@/server/modules/credits';

export const POST = withActor(async (actor, request, context) => {
  const credit = await creditController.decide(actor, await routeParam(context, 'id'), await readJson(request));
  return json(credit);
});
