import { prisma } from '@/server/shared/database/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export const sessions = {
  async open(userId: string) {
    return prisma.session.create({
      data: { userId, expiresAt: new Date(Date.now() + DAY_MS) },
    });
  },
  async valid(id: string) {
    const session = await prisma.session.findUnique({ where: { id } });
    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) return null;
    return session;
  },
  async renew(id: string) {
    return prisma.session.update({
      where: { id },
      data: { expiresAt: new Date(Date.now() + DAY_MS) },
    });
  },
  async revoke(id: string) {
    await prisma.session.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
  async revokeAll(userId: string) {
    await prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
