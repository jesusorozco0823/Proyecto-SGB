import type { User } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import type { PasswordHasher } from '@/server/shared/auth/password-hasher';
import { assertRole } from '@/server/shared/auth/authorize';
import { isUniqueViolation } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { AdminRepository } from '@/server/modules/admins/application/ports';
import { resetAccountPassword } from '@/server/modules/auth';
import { writeAudit } from '@/server/shared/audit/write-audit';

const DEFAULT_AVATAR = 'https://placehold.co/100x100.png';

export class AdminService {
  constructor(
    private readonly admins: AdminRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  list(actor: Actor) {
    assertRole(actor, ['superadmin']);
    return this.admins.list();
  }

  async create(actor: Actor, input: { displayName: string; documentNumber: string; phone: string; password: string }) {
    assertRole(actor, ['superadmin']);
    const passwordHash = await this.passwords.hash(input.password);
    try {
      return await this.admins.create({
        displayName: input.displayName,
        documentNumber: input.documentNumber,
        phone: input.phone,
        passwordHash,
        avatarUrl: DEFAULT_AVATAR,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(actor: Actor, id: string, input: { displayName: string; documentNumber: string; phone: string }) {
    assertRole(actor, ['superadmin']);
    await this.ensureAdmin(id);
    try {
      return await this.admins.update(id, input);
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async remove(actor: Actor, id: string) {
    assertRole(actor, ['superadmin']);
    if (actor.id === id) {
      throw new DomainError('FORBIDDEN', 'No puedes eliminar tu propia cuenta.');
    }
    await this.ensureAdmin(id);
    await this.admins.delete(id);
    await writeAudit(actor.id, 'admin.delete', id);
  }

  async resetPassword(actor: Actor, id: string, password: string) {
    assertRole(actor, ['superadmin']);
    await this.ensureAdmin(id);
    await resetAccountPassword(actor.id, id, password);
  }

  private async ensureAdmin(id: string): Promise<User> {
    const admin = await this.admins.findById(id);
    if (!admin || admin.role !== 'admin') {
      throw new DomainError('NOT_FOUND', 'No encontramos ese administrador.');
    }
    return admin;
  }

  private rethrowDuplicate(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new DomainError('DUPLICATE', 'Ya existe un usuario con ese documento.');
    }
    throw error;
  }
}
