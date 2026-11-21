import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { feedbackController } from '@/server/modules/feedback';

export const GET = withActor(async (actor) => json(await feedbackController.list(actor)));
