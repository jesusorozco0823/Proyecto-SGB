import { apiHandler, json, readJson } from '@/server/shared/http/api-handler';
import { assertRate, clientIp } from '@/server/shared/http/rate-limit';
import { jsonWithSession } from '@/server/shared/auth/session-cookie';
import { authController } from '@/server/modules/auth';

export const POST = apiHandler(async (request) => {
  const ip = clientIp(request);
  assertRate(`login:ip:${ip}`, 30, 15 * 60 * 1000);
  const body = await readJson(request);
  const documentNumber = typeof body === 'object' && body && 'documentNumber' in body ? String((body as { documentNumber?: unknown }).documentNumber ?? '') : '';
  assertRate(`login:doc:${ip}:${documentNumber}`, 8, 15 * 60 * 1000);
  const result = await authController.login(body);
  if (result.kind === 'session') return jsonWithSession({ user: result.user }, result.token);
  return json({ mfa: result.kind, challenge: result.challenge, otpauthUrl: result.otpauthUrl ?? null });
});
