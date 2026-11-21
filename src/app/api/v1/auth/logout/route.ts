import { apiHandler } from '@/server/shared/http/api-handler';
import { jsonWithoutSession, readSessionToken } from '@/server/shared/auth/session-cookie';
import { logoutCurrent } from '@/server/modules/auth';

export const POST = apiHandler(async () => {
  await logoutCurrent(await readSessionToken());
  return jsonWithoutSession();
});
