import { prisma } from '@/server/shared/database/prisma';
import { passwordHasher } from '@/server/shared/auth/password-hasher';
import { tokenIssuer } from '@/server/shared/auth/token-issuer';
import { sessions } from '@/server/shared/auth/sessions';
import { toPublicUser } from '@/server/shared/auth/actor';
import type { Actor } from '@/server/shared/auth/actor';
import { readSessionToken } from '@/server/shared/auth/session-cookie';
import { DomainError } from '@/server/shared/errors/domain-error';
import { PrismaAccountRepository } from '@/server/modules/auth/infrastructure/account.repository';
import { AuthService } from '@/server/modules/auth/application/auth.service';
import { AuthController } from '@/server/modules/auth/presentation/auth.controller';
import { toActor } from '@/server/modules/auth/application/ports';

const accounts = new PrismaAccountRepository(prisma);
const authService = new AuthService(accounts, passwordHasher, tokenIssuer);

export const authController = new AuthController(authService);

export async function requireActor(): Promise<{ actor: Actor; sessionId: string; expiresAt: Date }> {
  const token = await readSessionToken();
  if (!token) throw new DomainError('UNAUTHENTICATED', 'Debes iniciar sesión.');

  let userId = '';
  let sessionId = '';
  try {
    const verified = await tokenIssuer.verify(token);
    userId = verified.userId;
    sessionId = verified.sessionId;
  } catch {
    throw new DomainError('UNAUTHENTICATED', 'La sesión expiró. Vuelve a entrar.');
  }

  const session = await sessions.valid(sessionId);
  if (!session || session.userId !== userId) {
    throw new DomainError('UNAUTHENTICATED', 'La sesión ya no es válida.');
  }
  const account = await accounts.findById(userId);
  if (!account) throw new DomainError('UNAUTHENTICATED', 'La sesión ya no es válida.');
  return { actor: toActor(account), sessionId, expiresAt: session.expiresAt };
}

export function renewSession(sessionId: string, userId: string) {
  return authService.renew(sessionId, userId);
}

export function logoutCurrent(token: string | null) {
  return authService.logout(token);
}

export function publicActor(actor: Actor) {
  return toPublicUser(actor);
}

export function changeOwnPassword(userId: string, currentPassword: string, nextPassword: string) {
  return authService.changePassword(userId, currentPassword, nextPassword);
}

export function resetAccountPassword(actorId: string, userId: string, nextPassword: string) {
  return authService.resetPassword(actorId, userId, nextPassword);
}
