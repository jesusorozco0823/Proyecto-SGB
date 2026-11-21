import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { profileController } from '@/server/modules/profile';

export const PATCH = withActor(async (actor, request) => {
  const user = await profileController.update(actor, await readJson(request));
  return json(user);
});
