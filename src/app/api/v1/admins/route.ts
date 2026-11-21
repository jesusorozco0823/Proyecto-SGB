import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { adminController } from '@/server/modules/admins';

export const GET = withActor(async (actor) => json(await adminController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const admin = await adminController.create(actor, await readJson(request));
  return json(admin, 201);
});
