import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const DELETE = withActor(async (actor, _request, context) => {
  return json(await salonController.removeHoliday(actor, await routeParam(context, 'date')));
});
