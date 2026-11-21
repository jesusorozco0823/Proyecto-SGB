import { SignJWT, jwtVerify } from 'jose';
import { env } from '@/server/shared/config/env';

export interface TokenIssuer {
  sign(userId: string, sessionId: string): Promise<string>;
  verify(token: string): Promise<{ userId: string; sessionId: string }>;
  signChallenge(userId: string, purpose: 'mfa' | 'mfa_setup'): Promise<string>;
  verifyChallenge(token: string): Promise<{ userId: string; purpose: 'mfa' | 'mfa_setup' }>;
}

function secret() {
  return new TextEncoder().encode(env.authSecret());
}

export const tokenIssuer: TokenIssuer = {
  async sign(userId, sessionId) {
    return new SignJWT({ kind: 'session' })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setJti(sessionId)
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(secret());
  },
  async verify(token) {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || !payload.jti || payload.kind !== 'session') {
      throw new Error('Token de sesión inválido');
    }
    return { userId: payload.sub, sessionId: payload.jti };
  },
  async signChallenge(userId, purpose) {
    return new SignJWT({ kind: purpose })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(userId)
      .setIssuedAt()
      .setExpirationTime('10m')
      .sign(secret());
  },
  async verifyChallenge(token) {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub || (payload.kind !== 'mfa' && payload.kind !== 'mfa_setup')) {
      throw new Error('Reto inválido');
    }
    return { userId: payload.sub, purpose: payload.kind };
  },
};
