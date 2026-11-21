import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const GET = withActor(async (actor, request) => {
  const url = new URL(request.url);
  return json(await salonController.cashCut(actor, url.searchParams.get('from'), url.searchParams.get('to')));
});
