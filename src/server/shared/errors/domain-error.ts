export class DomainError extends Error {
  readonly status: number;

  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'DomainError';
    this.status = STATUS_BY_CODE[code] ?? 400;
  }
}

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION: 400,
  INVALID_SCHEDULE: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  GONE: 410,
  RATE_LIMIT: 429,
  DUPLICATE: 409,
  APPOINTMENT_OVERLAP: 409,
  INSUFFICIENT_STOCK: 409,
  INVALID_STATE: 409,
};
