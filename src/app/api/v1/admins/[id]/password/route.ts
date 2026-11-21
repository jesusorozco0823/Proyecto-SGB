import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { adminController } from '@/server/modules/admins';

export const POST = withActor(async (actor, request, context) => {
  await adminController.resetPassword(actor, await routeParam(context, 'id'), await readJson(request));
  return json({ ok: true });
});
