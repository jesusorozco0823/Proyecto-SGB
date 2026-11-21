import { apiHandler, json, readJson } from '@/server/shared/http/api-handler';
import { assertRate, clientIp } from '@/server/shared/http/rate-limit';
import { authController } from '@/server/modules/auth';

export const POST = apiHandler(async (request) => {
  const ip = clientIp(request);
  assertRate(`register:ip:${ip}`, 10, 60 * 60 * 1000);
  const body = await readJson(request);
  const documentNumber = typeof body === 'object' && body && 'documentNumber' in body ? String((body as { documentNumber?: unknown }).documentNumber ?? '') : '';
  assertRate(`register:doc:${ip}:${documentNumber}`, 5, 60 * 60 * 1000);
  await authController.register(body);
  return json({ ok: true }, 200);
});
