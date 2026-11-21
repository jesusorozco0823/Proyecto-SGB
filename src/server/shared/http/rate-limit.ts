import { DomainError } from '@/server/shared/errors/domain-error';

const hits = new Map<string, number[]>();

export function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'local';
  return 'local';
}

export function assertRate(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < windowMs);
  if (recent.length >= limit) {
    throw new DomainError('RATE_LIMIT', 'Demasiados intentos. Espera un momento y vuelve a intentar.');
  }
  recent.push(now);
  hits.set(key, recent);
}
