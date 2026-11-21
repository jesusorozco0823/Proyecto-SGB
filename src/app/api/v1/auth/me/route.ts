import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { publicActor } from '@/server/modules/auth';

export const GET = withActor(async (actor) => json(publicActor(actor)));
