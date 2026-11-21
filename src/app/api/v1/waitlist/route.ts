import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const POST = withActor(async (actor, request) => json(await salonController.joinWaitlist(actor, await readJson(request)), 201));
