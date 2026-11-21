import type { Barber as PrismaBarber, BarberSchedule, PrismaClient } from '@prisma/client';
import type { Barber } from '@/lib/types';
import { closedWeekRows, rowsToSchedule, type ScheduleRow } from '@/server/modules/barbers/domain/schedule';
import type { BarberDraft, BarberPatch, BarberRepository } from '@/server/modules/barbers/application/ports';

const barberInclude = { schedules: true } as const;

type BarberWithSchedule = PrismaBarber & { schedules: BarberSchedule[] };

function toBarber(barber: BarberWithSchedule): Barber {
  return {
    id: barber.id,
    userId: barber.userId,
    name: barber.name,
    documentNumber: barber.documentNumber,
    phone: barber.phone,
    skills: barber.skills,
    schedule: rowsToSchedule(barber.schedules),
    rating: barber.rating,
    imageUrl: barber.imageUrl,
  };
}

export class PrismaBarberRepository implements BarberRepository {
  constructor(private readonly db: PrismaClient) {}

  async list() {
    const barbers = await this.db.barber.findMany({ include: barberInclude, orderBy: { name: 'asc' } });
    return barbers.map(toBarber);
  }

  async findById(id: string) {
    const barber = await this.db.barber.findUnique({ where: { id }, include: barberInclude });
    return barber ? toBarber(barber) : null;
  }

  async findByUserId(userId: string) {
    const barber = await this.db.barber.findUnique({ where: { userId }, include: barberInclude });
    return barber ? toBarber(barber) : null;
  }

  async scheduleRows(barberId: string): Promise<ScheduleRow[]> {
    const rows = await this.db.barberSchedule.findMany({ where: { barberId } });
    return rows.map((row) => ({ dayOfWeek: row.dayOfWeek, startMin: row.startMin, endMin: row.endMin }));
  }

  async create(input: BarberDraft) {
    const barber = await this.db.barber.create({
      data: {
        name: input.name,
        documentNumber: input.documentNumber,
        phone: input.phone,
        skills: input.skills,
        imageUrl: input.imageUrl,
        user: {
          create: {
            displayName: input.name,
            documentNumber: input.documentNumber,
            phone: input.phone,
            passwordHash: input.passwordHash,
            role: 'barber',
            avatarUrl: input.imageUrl,
            preferences: [],
          },
        },
        schedules: { create: closedWeekRows() },
      },
      include: barberInclude,
    });
    return toBarber(barber);
  }

  async update(id: string, input: BarberPatch) {
    const current = await this.db.barber.findUnique({ where: { id } });
    if (!current) throw new Error('Barbero inexistente');

    const barber = await this.db.barber.update({
      where: { id },
      data: {
        name: input.name,
        documentNumber: input.documentNumber,
        phone: input.phone,
        skills: input.skills,
        imageUrl: input.imageUrl,
        user: {
          update: {
            displayName: input.name,
            documentNumber: input.documentNumber,
            phone: input.phone,
            avatarUrl: input.imageUrl,
          },
        },
      },
      include: barberInclude,
    });
    return toBarber(barber);
  }

  async replaceSchedule(barberId: string, rows: ScheduleRow[]) {
    await this.db.$transaction(
      rows.map((row) =>
        this.db.barberSchedule.upsert({
          where: { barberId_dayOfWeek: { barberId, dayOfWeek: row.dayOfWeek } },
          update: { startMin: row.startMin, endMin: row.endMin },
          create: { barberId, dayOfWeek: row.dayOfWeek, startMin: row.startMin, endMin: row.endMin },
        }),
      ),
    );
    return rowsToSchedule(rows);
  }

  countScheduled(barberId: string) {
    return this.db.appointment.count({ where: { barberId, status: 'scheduled' } });
  }

  async delete(id: string) {
    const barber = await this.db.barber.findUnique({ where: { id } });
    if (!barber) return;
    await this.db.user.delete({ where: { id: barber.userId } });
  }

  async busyOnDay(barberId: string, dayStart: Date, dayEnd: Date) {
    const rows = await this.db.appointment.findMany({
      where: {
        barberId,
        status: 'scheduled',
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    });
    return rows;
  }
}
