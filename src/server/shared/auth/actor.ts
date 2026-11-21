import type { User, UserRole } from '@/lib/types';

export type Actor = {
  id: string;
  role: UserRole;
  displayName: string;
  documentNumber: string;
  phone: string | null;
  preferences: string[];
  avatarUrl: string | null;
};

export function toPublicUser(actor: Actor): User {
  return {
    id: actor.id,
    displayName: actor.displayName,
    documentNumber: actor.documentNumber,
    role: actor.role,
    phone: actor.phone ?? undefined,
    preferences: actor.preferences,
    avatarUrl: actor.avatarUrl ?? undefined,
  };
}
