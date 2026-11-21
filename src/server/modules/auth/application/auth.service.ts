import type { PasswordHasher } from '@/server/shared/auth/password-hasher';
import type { TokenIssuer } from '@/server/shared/auth/token-issuer';
import { sessions } from '@/server/shared/auth/sessions';
import { generateTotpSecret, totpUri, verifyTotp } from '@/server/shared/auth/totp';
import { toPublicUser } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { writeAudit } from '@/server/shared/audit/write-audit';
import { toActor, type AccountRecord, type AccountRepository } from '@/server/modules/auth/application/ports';

const DEFAULT_AVATAR = 'https://placehold.co/100x100.png';
const DUMMY_HASH = '$2b$12$ntwtFxeSdBVXVnRE2ytki.M6m3JuqvZU.ELgkF/MTU9sbUC6p2FB2';

export type LoginResult =
  | { kind: 'session'; user: ReturnType<typeof toPublicUser>; token: string }
  | { kind: 'mfa' | 'mfa_setup'; challenge: string; otpauthUrl?: string };

export class AuthService {
  constructor(
    private readonly accounts: AccountRepository,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenIssuer,
  ) {}

  async register(input: { displayName: string; documentNumber: string; phone: string; password: string }) {
    const passwordHash = await this.passwords.hash(input.password);
    const existing = await this.accounts.findByDocument(input.documentNumber);
    if (existing) return { ok: true as const };
    try {
      await this.accounts.createClient({
        displayName: input.displayName,
        documentNumber: input.documentNumber,
        phone: input.phone,
        passwordHash,
        avatarUrl: DEFAULT_AVATAR,
      });
    } catch (error) {
      if (error instanceof DomainError && error.code === 'DUPLICATE') return { ok: true as const };
      throw error;
    }
    return { ok: true as const };
  }

  async login(input: { documentNumber: string; password: string }): Promise<LoginResult> {
    const account = await this.accounts.findByDocument(input.documentNumber);
    const matches = await this.passwords.verify(input.password, account?.passwordHash ?? DUMMY_HASH);
    if (!account || !matches) {
      throw new DomainError('UNAUTHENTICATED', 'Documento o contraseña incorrectos.');
    }
    if (account.role === 'admin' || account.role === 'superadmin') {
      return this.beginMfa(account);
    }
    return this.issue(account);
  }

  async confirmMfa(challenge: string, code: string) {
    let parsed: { userId: string; purpose: 'mfa' | 'mfa_setup' };
    try {
      parsed = await this.tokens.verifyChallenge(challenge);
    } catch {
      throw new DomainError('UNAUTHENTICATED', 'El código expiró. Vuelve a ingresar.');
    }
    const account = await this.accounts.findById(parsed.userId);
    if (!account?.totpSecret || !verifyTotp(account.totpSecret, code)) {
      throw new DomainError('UNAUTHENTICATED', 'El código no es válido.');
    }
    if (parsed.purpose === 'mfa_setup') {
      await this.accounts.saveTotp(account.id, account.totpSecret, true);
    }
    return this.issue(account);
  }

  async changePassword(userId: string, currentPassword: string, nextPassword: string) {
    const account = await this.accounts.findById(userId);
    if (!account) throw new DomainError('UNAUTHENTICATED', 'La sesión ya no es válida.');
    const matches = await this.passwords.verify(currentPassword, account.passwordHash);
    if (!matches) throw new DomainError('UNAUTHENTICATED', 'La contraseña actual no coincide.');
    await this.replacePassword(account.id, nextPassword, userId, 'password.change', account.id);
  }

  async resetPassword(actorId: string, userId: string, nextPassword: string) {
    const account = await this.accounts.findById(userId);
    if (!account) throw new DomainError('NOT_FOUND', 'No encontramos esa cuenta.');
    await this.replacePassword(account.id, nextPassword, actorId, 'password.reset', account.id);
  }

  async renew(sessionId: string, userId: string) {
    await sessions.renew(sessionId);
    return this.tokens.sign(userId, sessionId);
  }

  async logout(token: string | null) {
    if (!token) return;
    try {
      const { sessionId } = await this.tokens.verify(token);
      await sessions.revoke(sessionId);
    } catch {
      return;
    }
  }

  private async beginMfa(account: AccountRecord): Promise<LoginResult> {
    if (!account.totpEnabled || !account.totpSecret) {
      const secret = account.totpSecret ?? generateTotpSecret();
      if (!account.totpSecret) await this.accounts.saveTotp(account.id, secret, false);
      return {
        kind: 'mfa_setup',
        challenge: await this.tokens.signChallenge(account.id, 'mfa_setup'),
        otpauthUrl: totpUri(secret, account.displayName || account.documentNumber),
      };
    }
    return {
      kind: 'mfa',
      challenge: await this.tokens.signChallenge(account.id, 'mfa'),
    };
  }

  private async issue(account: AccountRecord) {
    const actor = toActor(account);
    const session = await sessions.open(account.id);
    const token = await this.tokens.sign(account.id, session.id);
    return { kind: 'session' as const, user: toPublicUser(actor), token };
  }

  private async replacePassword(userId: string, nextPassword: string, actorId: string, action: string, resource: string) {
    const passwordHash = await this.passwords.hash(nextPassword);
    await this.accounts.setPassword(userId, passwordHash);
    await sessions.revokeAll(userId);
    await writeAudit(actorId, action, resource);
  }
}
