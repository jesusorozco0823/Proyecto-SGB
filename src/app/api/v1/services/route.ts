import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { catalogController } from '@/server/modules/catalog';

export const GET = withActor(async (actor) => json(await catalogController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const service = await catalogController.create(actor, await readJson(request));
  return json(service, 201);
});
