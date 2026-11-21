import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { appointmentController } from '@/server/modules/appointments';

export const POST = withActor(async (actor, _request, context) => {
  return json(await appointmentController.confirmDeposit(actor, await routeParam(context, 'id')));
});
