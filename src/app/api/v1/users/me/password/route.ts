import { z } from 'zod';
import { json, readJson } from '@/server/shared/http/api-handler';
import { withActor } from '@/server/shared/http/with-actor';
import { changeOwnPassword } from '@/server/modules/auth';

const schema = z.object({
  currentPassword: z.string().min(1, 'Escribe tu contraseña actual'),
  newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72),
});

export const PATCH = withActor(async (actor, request) => {
  const data = schema.parse(await readJson(request));
  await changeOwnPassword(actor.id, data.currentPassword, data.newPassword);
  return json({ ok: true });
});
