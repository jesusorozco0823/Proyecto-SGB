import { DomainError } from '@/server/shared/errors/domain-error';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function assertSameOrigin(request: Request) {
  if (SAFE_METHODS.has(request.method)) return;
  const origin = request.headers.get('origin');
  if (!origin) return;
  const host = request.headers.get('host');
  let originHost = '';
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new DomainError('FORBIDDEN', 'Origen no permitido.');
  }
  if (!host || originHost !== host) {
    throw new DomainError('FORBIDDEN', 'Origen no permitido.');
  }
}
