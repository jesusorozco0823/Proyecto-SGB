import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const PUT = withActor(async (actor, request) => json(await agendaController.save(actor, await readJson(request))));
