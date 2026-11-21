import { json, routeParam } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { agendaController } from '@/server/modules/barbers';

export const DELETE = withActor(async (actor, _request, context) => json(await agendaController.removeTurn(actor, await routeParam(context, 'id'))));
