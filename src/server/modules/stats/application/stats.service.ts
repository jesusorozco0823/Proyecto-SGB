import type { Actor } from '@/server/shared/auth/actor';
import { CacheTtl, cachedRead } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import { addDays, startOfLocalDay, startOfWeekMonday } from '@/server/shared/time/calendar';
import type { StatsRepository } from '@/server/modules/stats/application/ports';

const LOW_STOCK = 5;

export class StatsService {
  constructor(private readonly stats: StatsRepository) {}

  forActor(actor: Actor) {
    const key = actor.role === 'admin' || actor.role === 'superadmin' ? `stats:${actor.role}` : `stats:${actor.role}:${actor.id}`;
    return cachedRead(key, CacheTtl.lists, () => this.load(actor));
  }

  private async load(actor: Actor) {
    const today = startOfLocalDay(new Date());
    const tomorrow = addDays(today, 1);
    const weekStart = startOfWeekMonday(today);
    const weekEnd = addDays(weekStart, 7);

    if (actor.role === 'admin') {
      const [appointmentsToday, serviceRevenue, orderRevenue, newClients, lowStock] = await Promise.all([
        this.stats.countAppointments({ from: today, to: tomorrow }),
        this.stats.sumCompletedServices({ from: weekStart, to: weekEnd }),
        this.stats.sumActiveOrders({ from: weekStart, to: weekEnd }),
        this.stats.countNewClients(weekStart),
        this.stats.countLowStock(LOW_STOCK),
      ]);
      return {
        role: 'admin' as const,
        appointmentsToday,
        weeklyRevenue: serviceRevenue + orderRevenue,
        newClients,
        lowStock,
      };
    }

    if (actor.role === 'barber') {
      const [appointmentsToday, appointmentsWeek, weeklyRevenue] = await Promise.all([
        this.stats.countAppointments({ from: today, to: tomorrow, barberUserId: actor.id }),
        this.stats.countAppointments({ from: weekStart, to: weekEnd, barberUserId: actor.id }),
        this.stats.sumCompletedServices({ from: weekStart, to: weekEnd, barberUserId: actor.id }),
      ]);
      return { role: 'barber' as const, appointmentsToday, appointmentsWeek, weeklyRevenue };
    }

    if (actor.role === 'client') {
      const [nextAppointment, history] = await Promise.all([
        this.stats.nextAppointment(actor.id, new Date()),
        this.stats.recentCompleted(actor.id, 5),
      ]);
      return { role: 'client' as const, nextAppointment, history };
    }

    if (actor.role === 'superadmin') {
      return { role: 'superadmin' as const, adminCount: await this.stats.countAdmins() };
    }

    throw new DomainError('FORBIDDEN', 'No hay métricas para este rol.');
  }
}
