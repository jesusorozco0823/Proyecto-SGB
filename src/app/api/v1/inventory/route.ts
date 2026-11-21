import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { inventoryController } from '@/server/modules/inventory';

export const GET = withActor(async (actor) => json(await inventoryController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const item = await inventoryController.create(actor, await readJson(request));
  return json(item, 201);
});
