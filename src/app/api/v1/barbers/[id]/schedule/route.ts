import { json, readJson, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { barberController } from '@/server/modules/barbers';

export const PUT = withActor(async (actor, request, context) => {
  const schedule = await barberController.replaceSchedule(
    actor,
    await routeParam(context, 'id'),
    await readJson(request),
  );
  return json(schedule);
});
