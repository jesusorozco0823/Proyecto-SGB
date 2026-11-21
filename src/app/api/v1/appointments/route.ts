import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { appointmentController } from '@/server/modules/appointments';

export const GET = withActor(async (actor) => json(await appointmentController.list(actor)));

export const POST = withActor(async (actor, request) => {
  const appointment = await appointmentController.create(actor, await readJson(request));
  return json(appointment, 201);
});
