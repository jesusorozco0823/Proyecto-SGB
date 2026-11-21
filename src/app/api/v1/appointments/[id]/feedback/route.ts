import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { feedbackController } from '@/server/modules/feedback';

export const POST = withActor(async (actor, request, context) => {
  const feedback = await feedbackController.create(actor, await routeParam(context, 'id'), await readJson(request));
  return json(feedback, 201);
});
