import type { UserRole } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';

export type AccountRecord = {
  id: string;
  displayName: string;
  documentNumber: string;
  passwordHash: string;
  role: UserRole;
  phone: string | null;
  preferences: string[];
  avatarUrl: string | null;
  totpSecret: string | null;
  totpEnabled: boolean;
  blockedAt: Date | null;
};

export interface AccountRepository {
  findByDocument(documentNumber: string): Promise<AccountRecord | null>;
  findById(id: string): Promise<AccountRecord | null>;
  createClient(input: {
    displayName: string;
    documentNumber: string;
    phone: string;
    passwordHash: string;
    avatarUrl: string;
  }): Promise<AccountRecord>;
  saveTotp(id: string, secret: string, enabled: boolean): Promise<void>;
  setPassword(id: string, passwordHash: string): Promise<void>;
}

export function toActor(account: AccountRecord): Actor {
  return {
    id: account.id,
    role: account.role,
    displayName: account.displayName,
    documentNumber: account.documentNumber,
    phone: account.phone,
    preferences: account.preferences,
    avatarUrl: account.avatarUrl,
  };
}
