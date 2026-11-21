import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { creditController } from '@/server/modules/credits';

export const GET = withActor(async (actor) => json(await creditController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const credit = await creditController.ask(actor, await readJson(request));
  return json(credit, 201);
});
