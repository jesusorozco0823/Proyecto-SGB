import type { Prisma, PrismaClient } from '@prisma/client';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import type { AppointmentSummary, StatsRepository } from '@/server/modules/stats/application/ports';

const summaryInclude = {
  barber: { select: { name: true } },
  barberService: { select: { name: true } },
  services: { include: { service: { select: { name: true } } } },
} satisfies Prisma.AppointmentInclude;

type SummaryRow = Prisma.AppointmentGetPayload<{ include: typeof summaryInclude }>;

function toSummary(row: SummaryRow): AppointmentSummary {
  return {
    datetime: row.startsAt.toISOString(),
    barberName: row.barber.name,
    serviceNames: row.barberService ? [row.barberService.name] : row.services.map((line) => line.service.name),
  };
}

export class PrismaStatsRepository implements StatsRepository {
  constructor(private readonly db: PrismaClient) {}

  countAppointments(where: { from: Date; to: Date; barberUserId?: string }) {
    return this.db.appointment.count({
      where: {
        startsAt: { gte: where.from, lt: where.to },
        status: { not: 'cancelled' },
        ...(where.barberUserId ? { barber: { userId: where.barberUserId } } : {}),
      },
    });
  }

  async sumCompletedServices(where: { from: Date; to: Date; barberUserId?: string }) {
    const rows = await this.db.appointment.findMany({
      where: {
        status: 'completed',
        startsAt: { gte: where.from, lt: where.to },
        ...(where.barberUserId ? { barber: { userId: where.barberUserId } } : {}),
      },
      select: { barberService: { select: { price: true } }, services: { select: { price: true } } },
    });
    return rows.reduce((sum, row) => {
      if (row.barberService) return sum + decimalToNumber(row.barberService.price);
      return sum + row.services.reduce((inner, line) => inner + decimalToNumber(line.price), 0);
    }, 0);
  }

  async sumActiveOrders(where: { from: Date; to: Date }) {
    const result = await this.db.order.aggregate({
      where: {
        status: { not: 'cancelled' },
        paymentStatus: 'paid',
        createdAt: { gte: where.from, lt: where.to },
      },
      _sum: { total: true },
    });
    return result._sum.total ? decimalToNumber(result._sum.total) : 0;
  }

  countNewClients(from: Date) {
    return this.db.user.count({ where: { role: 'client', createdAt: { gte: from } } });
  }

  countLowStock(threshold: number) {
    return this.db.inventoryItem.count({ where: { active: true, stock: { lte: threshold } } });
  }

  countAdmins() {
    return this.db.user.count({ where: { role: 'admin' } });
  }

  async nextAppointment(userId: string, from: Date) {
    const row = await this.db.appointment.findFirst({
      where: { userId, status: 'scheduled', startsAt: { gte: from } },
      include: summaryInclude,
      orderBy: { startsAt: 'asc' },
    });
    return row ? toSummary(row) : null;
  }

  async recentCompleted(userId: string, take: number) {
    const rows = await this.db.appointment.findMany({
      where: { userId, status: 'completed' },
      include: summaryInclude,
      orderBy: { startsAt: 'desc' },
      take,
    });
    return rows.map(toSummary);
  }
}
