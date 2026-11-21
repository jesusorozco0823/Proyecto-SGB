import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { messageController } from '@/server/modules/messages';
import '@/server/modules/appointments';

export const GET = withActor(async (actor) => json(await messageController.unread(actor)));
