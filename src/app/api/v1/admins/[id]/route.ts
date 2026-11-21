import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { adminController } from '@/server/modules/admins';

export const PATCH = withActor(async (actor, request, context) => {
  const admin = await adminController.update(actor, await routeParam(context, 'id'), await readJson(request));
  return json(admin);
});

export const DELETE = withActor(async (actor, _request, context) => {
  await adminController.remove(actor, await routeParam(context, 'id'));
  return json({ ok: true });
});
