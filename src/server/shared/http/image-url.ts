import { DomainError } from '@/server/shared/errors/domain-error';

const PRIVATE_HOST = /^(localhost|0\.0\.0\.0|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;

export function assertImageUrl(value: string) {
  if (value.length > 500) {
    throw new DomainError('VALIDATION', 'La URL de la imagen es demasiado larga.');
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new DomainError('VALIDATION', 'La imagen debe ser una URL https.');
  }
  if (url.protocol !== 'https:' || url.username || url.password || PRIVATE_HOST.test(url.hostname)) {
    throw new DomainError('VALIDATION', 'La imagen debe ser una URL https pública.');
  }
  return url.toString();
}
