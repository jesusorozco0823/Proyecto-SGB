import type { PrismaClient, UserRole } from '@prisma/client';
import type { ChatMessage, ChatUser, MessageRepository } from '@/server/modules/messages/application/ports';

const DAY_MS = 24 * 60 * 60 * 1000;
let purgedAt = 0;

function toUser(row: { id: string; displayName: string; role: UserRole }): ChatUser {
  return { id: row.id, displayName: row.displayName, role: row.role };
}

function toMessage(row: { id: string; senderId: string; recipientId: string; body: string; createdAt: Date; readAt: Date | null }): ChatMessage {
  return {
    id: row.id,
    senderId: row.senderId,
    recipientId: row.recipientId,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly db: PrismaClient) {}

  async purgeExpired(cutoff: Date) {
    const now = Date.now();
    if (now - purgedAt < 60_000 && cutoff.getTime() > now - DAY_MS - 1000) return;
    purgedAt = now;
    await this.db.message.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }

  async findUser(id: string) {
    const user = await this.db.user.findUnique({ where: { id }, select: { id: true, displayName: true, role: true } });
    return user ? toUser(user) : null;
  }

  async barberIdForUser(userId: string) {
    const barber = await this.db.barber.findUnique({ where: { userId }, select: { id: true } });
    return barber?.id ?? null;
  }

  async clientsOfBarber(barberId: string) {
    const [appointments, waiting] = await Promise.all([
      this.db.appointment.findMany({
        where: { barberId },
        distinct: ['userId'],
        select: { client: { select: { id: true, displayName: true, role: true } } },
      }),
      this.db.waitlistEntry.findMany({
        where: { barberId },
        distinct: ['userId'],
        select: { user: { select: { id: true, displayName: true, role: true } } },
      }),
    ]);
    return [...appointments.map((row) => toUser(row.client)), ...waiting.map((row) => toUser(row.user))];
  }

  async barbersOfClient(clientId: string) {
    const [appointments, waiting] = await Promise.all([
      this.db.appointment.findMany({
        where: { userId: clientId },
        distinct: ['barberId'],
        select: { barber: { select: { user: { select: { id: true, displayName: true, role: true } } } } },
      }),
      this.db.waitlistEntry.findMany({
        where: { userId: clientId },
        distinct: ['barberId'],
        select: { barber: { select: { user: { select: { id: true, displayName: true, role: true } } } } },
      }),
    ]);
    return [...appointments.map((row) => toUser(row.barber.user)), ...waiting.map((row) => toUser(row.barber.user))];
  }

  async usersByRole(roles: ChatUser['role'][]) {
    const rows = await this.db.user.findMany({
      where: { role: { in: roles } },
      select: { id: true, displayName: true, role: true },
      orderBy: { displayName: 'asc' },
    });
    return rows.map(toUser);
  }

  async create(input: { senderId: string; recipientId: string; body: string }) {
    const saved = await this.db.message.create({ data: input });
    return toMessage(saved);
  }

  async thread(userId: string, otherId: string, cutoff: Date) {
    const rows = await this.db.message.findMany({
      where: {
        createdAt: { gte: cutoff },
        OR: [
          { senderId: userId, recipientId: otherId },
          { senderId: otherId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(toMessage);
  }

  async markRead(recipientId: string, senderId: string) {
    const updated = await this.db.message.updateMany({
      where: { recipientId, senderId, readAt: null },
      data: { readAt: new Date() },
    });
    return updated.count;
  }

  async activity(userId: string, cutoff: Date) {
    const rows = await this.db.message.findMany({
      where: { createdAt: { gte: cutoff }, OR: [{ senderId: userId }, { recipientId: userId }] },
      select: { senderId: true, recipientId: true, readAt: true },
    });
    const totals = new Map<string, { incoming: number; outgoingUnread: number }>();
    for (const row of rows) {
      const peerId = row.senderId === userId ? row.recipientId : row.senderId;
      const current = totals.get(peerId) ?? { incoming: 0, outgoingUnread: 0 };
      if (row.recipientId === userId && !row.readAt) current.incoming += 1;
      if (row.senderId === userId && !row.readAt) current.outgoingUnread += 1;
      totals.set(peerId, current);
    }
    return totals;
  }

  async unread(recipientId: string, cutoff: Date) {
    const rows = await this.db.message.findMany({
      where: { recipientId, readAt: null, createdAt: { gte: cutoff } },
      include: { sender: { select: { displayName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });
    return rows.map((row) => ({ ...toMessage(row), senderName: row.sender.displayName }));
  }
}
