import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { salonController } from '@/server/modules/salon';

export const GET = withActor(async (actor) => json(await salonController.holidays(actor)));

export const POST = withActor(async (actor, request) => json(await salonController.addHoliday(actor, await readJson(request)), 201));
