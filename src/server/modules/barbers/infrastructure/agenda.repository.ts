import type { PrismaClient } from '@prisma/client';
import type { AgendaRepository, BarberOffering, OfferingDraft, OpenTurn, StoredPlan } from '@/server/modules/barbers/application/agenda.ports';

function calendarDate(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function todayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function toOffering(row: {
  id: string;
  barberId: string;
  name: string;
  durationMinutes: number;
  price: { toString(): string } | number;
  description: string | null;
  isSpecial: boolean;
  active: boolean;
}): BarberOffering {
  return { ...row, price: Number(row.price) };
}

export class PrismaAgendaRepository implements AgendaRepository {
  constructor(private readonly db: PrismaClient) {}

  async lunchDuration() {
    const policy = await this.db.lunchPolicy.findUnique({ where: { id: 'default' } });
    return policy?.durationMinutes ?? 60;
  }

  async depositAmount() {
    const policy = await this.db.lunchPolicy.findUnique({ where: { id: 'default' } });
    return policy ? Number(policy.depositAmount) : 0;
  }

  async setLunchDuration(minutes: number) {
    const policy = await this.db.lunchPolicy.upsert({
      where: { id: 'default' },
      create: { id: 'default', durationMinutes: minutes },
      update: { durationMinutes: minutes },
    });
    return policy.durationMinutes;
  }

  async listOfferings(barberId: string) {
    const rows = await this.db.barberService.findMany({
      where: { barberId, active: true },
      orderBy: [{ durationMinutes: 'asc' }, { name: 'asc' }],
    });
    return rows.map(toOffering);
  }

  async createOffering(barberId: string, input: OfferingDraft) {
    const row = await this.db.barberService.create({ data: { barberId, ...input } });
    return toOffering(row);
  }

  async updateOffering(barberId: string, id: string, input: Partial<OfferingDraft> & { active?: boolean }) {
    const existing = await this.db.barberService.findFirst({ where: { id, barberId } });
    if (!existing) return null;
    const row = await this.db.barberService.update({ where: { id }, data: input });
    return toOffering(row);
  }

  async savePlans(barberId: string, plans: StoredPlan[]) {
    await this.db.$transaction(async (tx) => {
      for (const plan of plans) {
        const saved = await tx.dayPlan.upsert({
          where: { barberId_dayOfWeek: { barberId, dayOfWeek: plan.dayOfWeek } },
          create: {
            barberId,
            dayOfWeek: plan.dayOfWeek,
            openMin: plan.openMin,
            closeMin: plan.closeMin,
            lunchStartMin: plan.lunchStartMin,
            effectiveCloseMin: plan.effectiveCloseMin,
          },
          update: {
            openMin: plan.openMin,
            closeMin: plan.closeMin,
            lunchStartMin: plan.lunchStartMin,
            effectiveCloseMin: plan.effectiveCloseMin,
          },
        });
        await tx.turnTemplate.deleteMany({ where: { dayPlanId: saved.id } });
        if (plan.turns.length > 0) {
          await tx.turnTemplate.createMany({
            data: plan.turns.map((turn) => ({
              dayPlanId: saved.id,
              startMin: turn.startMin,
              endMin: turn.endMin,
              durationMinutes: turn.durationMinutes,
              serviceId: turn.serviceId,
              isExtra: turn.isExtra,
              placedByBarber: turn.placedByBarber,
            })),
          });
        }
        await tx.barberSchedule.upsert({
          where: { barberId_dayOfWeek: { barberId, dayOfWeek: plan.dayOfWeek } },
          create: { barberId, dayOfWeek: plan.dayOfWeek, startMin: plan.openMin, endMin: plan.effectiveCloseMin },
          update: { startMin: plan.openMin, endMin: plan.effectiveCloseMin },
        });
      }

      await tx.dayTurn.deleteMany({
        where: { barberId, status: 'open', date: { gte: todayUtc() } },
      });
    });
  }

  async isClosed(barberId: string, date: Date) {
    const holiday = await this.db.holiday.findUnique({ where: { date } });
    if (holiday) return true;
    const dayOff = await this.db.dayOff.findUnique({ where: { barberId_date: { barberId, date } } });
    return Boolean(dayOff);
  }

  async openTurns(barberId: string, date: string) {
    const day = calendarDate(date);
    if (!day) return [];
    const plan = await this.db.dayPlan.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek: day.getUTCDay() } },
      include: { templates: true },
    });
    if (!plan) return [];

    for (const template of plan.templates) {
      const existing = await this.db.dayTurn.findUnique({
        where: { barberId_date_startMin: { barberId, date: day, startMin: template.startMin } },
      });
      if (existing) continue;
      await this.db.dayTurn.create({
        data: {
          barberId,
          templateId: template.id,
          date: day,
          startMin: template.startMin,
          endMin: template.endMin,
          durationMinutes: template.durationMinutes,
          serviceId: template.serviceId,
          status: 'open',
          isExtra: template.isExtra,
        },
      });
    }

    const rows = await this.db.dayTurn.findMany({
      where: { barberId, date: day, status: 'open' },
      orderBy: { startMin: 'asc' },
    });
    return rows.map((row): OpenTurn => ({
      id: row.id,
      startMin: row.startMin,
      endMin: row.endMin,
      durationMinutes: row.durationMinutes,
      serviceId: row.serviceId,
      isExtra: row.isExtra,
    }));
  }

  async plannedWeekdays(barberId: string) {
    const rows = await this.db.dayPlan.findMany({ where: { barberId }, select: { dayOfWeek: true } });
    return rows.map((row) => row.dayOfWeek);
  }

  async planFor(barberId: string, dayOfWeek: number) {
    const plan = await this.db.dayPlan.findUnique({
      where: { barberId_dayOfWeek: { barberId, dayOfWeek } },
      select: { openMin: true, closeMin: true, lunchStartMin: true, effectiveCloseMin: true },
    });
    return plan;
  }

  async turnsOn(barberId: string, date: Date) {
    const rows = await this.db.dayTurn.findMany({ where: { barberId, date } });
    return rows.map((row) => ({
      id: row.id,
      startMin: row.startMin,
      endMin: row.endMin,
      status: row.status,
      templateId: row.templateId,
    }));
  }

  async placeManualTurn(input: { barberId: string; date: Date; startMin: number; endMin: number; durationMinutes: number; serviceId: string; isExtra: boolean }) {
    const existing = await this.db.dayTurn.findUnique({
      where: { barberId_date_startMin: { barberId: input.barberId, date: input.date, startMin: input.startMin } },
    });
    if (existing?.status === 'withdrawn') {
      await this.db.dayTurn.update({
        where: { id: existing.id },
        data: {
          endMin: input.endMin,
          durationMinutes: input.durationMinutes,
          serviceId: input.serviceId,
          status: 'open',
          templateId: null,
          isExtra: input.isExtra,
        },
      });
      return;
    }
    await this.db.dayTurn.create({
      data: {
        barberId: input.barberId,
        date: input.date,
        startMin: input.startMin,
        endMin: input.endMin,
        durationMinutes: input.durationMinutes,
        serviceId: input.serviceId,
        status: 'open',
        isExtra: input.isExtra,
      },
    });
  }

  async withdrawTurn(barberId: string, id: string) {
    const turn = await this.db.dayTurn.findFirst({ where: { id, barberId } });
    if (!turn) return 'missing' as const;
    if (turn.status === 'booked') return 'booked' as const;
    if (turn.templateId) {
      await this.db.dayTurn.update({ where: { id }, data: { status: 'withdrawn' } });
    } else {
      await this.db.dayTurn.delete({ where: { id } });
    }
    return 'ok' as const;
  }
}
