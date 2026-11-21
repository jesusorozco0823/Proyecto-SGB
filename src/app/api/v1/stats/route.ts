import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { statsController } from '@/server/modules/stats';

export const GET = withActor(async (actor) => json(await statsController.forActor(actor)));
