import { apiHandler } from '@/server/shared/http/api-handler';
import { DomainError } from '@/server/shared/errors/domain-error';

export const GET = apiHandler(async () => {
  throw new DomainError('GONE', 'La disponibilidad se consulta por turnos.');
});
