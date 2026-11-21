import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const POST = withActor(async (actor, request) => json(await agendaController.preview(actor, await readJson(request))));
