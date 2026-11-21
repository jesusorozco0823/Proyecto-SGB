import type { Actor } from '@/server/shared/auth/actor';

export interface ProfileRepository {
  update(id: string, input: { displayName?: string; phone?: string; preferences?: string[]; avatarUrl?: string }): Promise<Actor>;
}
