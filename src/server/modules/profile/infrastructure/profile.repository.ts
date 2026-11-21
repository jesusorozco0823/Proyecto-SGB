import type { PrismaClient } from '@prisma/client';
import type { Actor } from '@/server/shared/auth/actor';
import type { ProfileRepository } from '@/server/modules/profile/application/ports';

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly db: PrismaClient) {}

  async update(id: string, input: { displayName?: string; phone?: string; preferences?: string[]; avatarUrl?: string }): Promise<Actor> {
    const user = await this.db.user.update({
      where: { id },
      data: {
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(input.phone !== undefined ? { phone: input.phone } : {}),
        ...(input.preferences !== undefined ? { preferences: input.preferences } : {}),
        ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      },
    });

    return {
      id: user.id,
      role: user.role,
      displayName: user.displayName,
      documentNumber: user.documentNumber,
      phone: user.phone,
      preferences: user.preferences,
      avatarUrl: user.avatarUrl,
    };
  }
}
