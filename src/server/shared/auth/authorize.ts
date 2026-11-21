import type { UserRole } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';

export function assertRole(actor: Actor, roles: UserRole[]) {
  if (!roles.includes(actor.role)) {
    throw new DomainError('FORBIDDEN', 'No tienes permiso para esta acción.');
  }
}
