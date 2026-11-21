import { apiHandler, readJson } from '@/server/shared/http/api-handler';
import { assertRate, clientIp } from '@/server/shared/http/rate-limit';
import { jsonWithSession } from '@/server/shared/auth/session-cookie';
import { authController } from '@/server/modules/auth';

export const POST = apiHandler(async (request) => {
  assertRate(`mfa:ip:${clientIp(request)}`, 10, 15 * 60 * 1000);
  const result = await authController.confirmMfa(await readJson(request));
  return jsonWithSession({ user: result.user }, result.token);
});
