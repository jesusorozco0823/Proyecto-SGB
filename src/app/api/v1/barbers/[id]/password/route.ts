import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { barberController } from '@/server/modules/barbers';

export const POST = withActor(async (actor, request, context) => {
  await barberController.resetPassword(actor, await routeParam(context, 'id'), await readJson(request));
  return json({ ok: true });
});
