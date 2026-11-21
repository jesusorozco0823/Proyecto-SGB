import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { barberController } from '@/server/modules/barbers';

export const GET = withActor(async (actor) => json(await barberController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const barber = await barberController.create(actor, await readJson(request));
  return json(barber, 201);
});
