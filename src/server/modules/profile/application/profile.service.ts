import { toPublicUser } from '@/server/shared/auth/actor';
import type { Actor } from '@/server/shared/auth/actor';
import { assertImageUrl } from '@/server/shared/http/image-url';
import type { ProfileRepository } from '@/server/modules/profile/application/ports';

export class ProfileService {
  constructor(private readonly profiles: ProfileRepository) {}

  async update(actor: Actor, input: { displayName?: string; phone?: string; preferences?: string[]; avatarUrl?: string }) {
    const updated = await this.profiles.update(actor.id, {
      ...input,
      avatarUrl: input.avatarUrl === undefined ? undefined : assertImageUrl(input.avatarUrl),
    });
    return toPublicUser(updated);
  }
}
