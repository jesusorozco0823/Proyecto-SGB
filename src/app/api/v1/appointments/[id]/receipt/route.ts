import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { appointmentController } from '@/server/modules/appointments';

export const GET = withActor(async (actor, _request, context) => {
  return json(await appointmentController.receipt(actor, await routeParam(context, 'id')));
});
