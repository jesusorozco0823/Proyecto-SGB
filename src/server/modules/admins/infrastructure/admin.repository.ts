import type { PrismaClient, User as PrismaUser } from '@prisma/client';
import type { User } from '@/lib/types';
import type { AdminDraft, AdminPatch, AdminRepository } from '@/server/modules/admins/application/ports';

function toUser(user: PrismaUser): User {
  return {
    id: user.id,
    displayName: user.displayName,
    documentNumber: user.documentNumber,
    role: user.role,
    phone: user.phone ?? undefined,
    preferences: user.preferences,
    avatarUrl: user.avatarUrl ?? undefined,
  };
}

export class PrismaAdminRepository implements AdminRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const users = await this.db.user.findMany({
      where: { role: 'admin' },
      orderBy: { displayName: 'asc' },
    });
    return users.map(toUser);
  }

  async findById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? toUser(user) : null;
  }

  async create(input: AdminDraft) {
    const user = await this.db.user.create({
      data: {
        displayName: input.displayName,
        documentNumber: input.documentNumber,
        phone: input.phone,
        passwordHash: input.passwordHash,
        avatarUrl: input.avatarUrl,
        role: 'admin',
        preferences: [],
      },
    });
    return toUser(user);
  }

  async update(id: string, input: AdminPatch) {
    const user = await this.db.user.update({
      where: { id },
      data: {
        displayName: input.displayName,
        documentNumber: input.documentNumber,
        phone: input.phone,
      },
    });
    return toUser(user);
  }

  async delete(id: string) {
    await this.db.user.delete({ where: { id } });
  }
}
