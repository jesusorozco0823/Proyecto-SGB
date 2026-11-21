import type { User } from '@/lib/types';

export type AdminDraft = {
  displayName: string;
  documentNumber: string;
  phone: string;
  passwordHash: string;
  avatarUrl: string;
};

export type AdminPatch = {
  displayName: string;
  documentNumber: string;
  phone: string;
};

export interface AdminRepository {
  list(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(input: AdminDraft): Promise<User>;
  update(id: string, input: AdminPatch): Promise<User>;
  delete(id: string): Promise<void>;
}
