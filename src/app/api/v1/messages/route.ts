import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { messageController } from '@/server/modules/messages';
import { DomainError } from '@/server/shared/errors/domain-error';

export const GET = withActor(async (actor, request) => {
  const otherId = new URL(request.url).searchParams.get('with');
  if (!otherId) return json(await messageController.contacts(actor));
  return json(await messageController.thread(actor, otherId));
});

export const POST = withActor(async (actor, request) => {
  const body = await readJson(request);
  if (!body || typeof body !== 'object') throw new DomainError('VALIDATION', 'El mensaje no es válido.');
  return json(await messageController.send(actor, body), 201);
});
