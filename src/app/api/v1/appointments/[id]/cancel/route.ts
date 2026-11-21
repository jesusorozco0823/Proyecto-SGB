import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { appointmentController } from '@/server/modules/appointments';

export const POST = withActor(async (actor, request, context) => {
  const appointment = await appointmentController.cancel(actor, await routeParam(context, 'id'), await readJson(request));
  return json(appointment);
});
