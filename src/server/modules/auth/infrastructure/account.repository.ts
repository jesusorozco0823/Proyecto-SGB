import type { PrismaClient, User } from '@prisma/client';
import { isUniqueViolation } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { AccountRecord, AccountRepository } from '@/server/modules/auth/application/ports';

function toRecord(user: User): AccountRecord {
  return {
    id: user.id,
    displayName: user.displayName,
    documentNumber: user.documentNumber,
    passwordHash: user.passwordHash,
    role: user.role,
    phone: user.phone,
    preferences: user.preferences,
    avatarUrl: user.avatarUrl,
    totpSecret: user.totpSecret,
    totpEnabled: user.totpEnabled,
    blockedAt: user.blockedAt,
  };
}

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByDocument(documentNumber: string) {
    const user = await this.db.user.findUnique({ where: { documentNumber } });
    return user ? toRecord(user) : null;
  }

  async findById(id: string) {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? toRecord(user) : null;
  }

  async createClient(input: {
    displayName: string;
    documentNumber: string;
    phone: string;
    passwordHash: string;
    avatarUrl: string;
  }) {
    try {
      const user = await this.db.user.create({
        data: {
          displayName: input.displayName,
          documentNumber: input.documentNumber,
          phone: input.phone,
          passwordHash: input.passwordHash,
          avatarUrl: input.avatarUrl,
          role: 'client',
          preferences: [],
        },
      });
      return toRecord(user);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError('DUPLICATE', 'Ya existe una cuenta con ese documento.');
      }
      throw error;
    }
  }

  async saveTotp(id: string, secret: string, enabled: boolean) {
    await this.db.user.update({ where: { id }, data: { totpSecret: secret, totpEnabled: enabled } });
  }

  async setPassword(id: string, passwordHash: string) {
    await this.db.user.update({ where: { id }, data: { passwordHash } });
  }
}
