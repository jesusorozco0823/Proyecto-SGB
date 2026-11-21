import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { appointmentController } from '@/server/modules/appointments';

export const POST = withActor(async (actor, _request, context) => {
  const appointment = await appointmentController.complete(actor, await routeParam(context, 'id'));
  return json(appointment);
});
