import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const GET = withActor(async (actor, request) => {
  const date = new URL(request.url).searchParams.get('date');
  return json(await salonController.reminders(actor, date));
});
