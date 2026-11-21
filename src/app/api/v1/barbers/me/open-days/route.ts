import { json } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const GET = withActor(async (actor) => json(await agendaController.openDays(actor)));
