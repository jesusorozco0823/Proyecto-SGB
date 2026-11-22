import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const GET = withActor(async (actor) => json(await salonController.hours(actor)));
