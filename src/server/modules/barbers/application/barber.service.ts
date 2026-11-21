import type { Barber } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import type { PasswordHasher } from '@/server/shared/auth/password-hasher';
import { assertRole } from '@/server/shared/auth/authorize';
import { isUniqueViolation } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import { parseLocalDate } from '@/server/shared/time/calendar';
import type { WeekSchedule } from '@/server/shared/time/schedule-time';
import { buildSlots, scheduleToRows } from '@/server/modules/barbers/domain/schedule';
import { emptyWeek } from '@/server/shared/time/schedule-time';
import { assertImageUrl } from '@/server/shared/http/image-url';
import { resetAccountPassword } from '@/server/modules/auth';
import type { BarberPatch, BarberRepository } from '@/server/modules/barbers/application/ports';

type CreateBarberInput = {
  name: string;
  documentNumber: string;
  phone: string;
  password: string;
  skills: string[];
  imageUrl: string;
};

export class BarberService {
  constructor(
    private readonly barbers: BarberRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async list(actor: Actor) {
    assertRole(actor, ['admin', 'client', 'barber', 'superadmin']);
    const rows = await this.barbers.list();
    if (actor.role === 'admin' || actor.role === 'superadmin') return rows;
    return rows.map((barber) => ({ ...barber, userId: '', documentNumber: '', phone: '', schedule: emptyWeek() }));
  }

  async own(actor: Actor) {
    assertRole(actor, ['barber']);
    return this.requireByUser(actor.id);
  }

  async create(actor: Actor, input: CreateBarberInput) {
    assertRole(actor, ['admin']);
    const passwordHash = await this.passwords.hash(input.password);
    try {
      return await this.barbers.create({
        name: input.name,
        documentNumber: input.documentNumber,
        phone: input.phone,
        skills: input.skills,
        imageUrl: assertImageUrl(input.imageUrl),
        passwordHash,
      });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(actor: Actor, id: string, input: BarberPatch) {
    assertRole(actor, ['admin']);
    await this.require(id);
    try {
      return await this.barbers.update(id, { ...input, imageUrl: assertImageUrl(input.imageUrl) });
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async replaceSchedule(actor: Actor, barberId: string, schedule: WeekSchedule) {
    const barber = await this.require(barberId);
    const isOwner = actor.role === 'barber' && barber.userId === actor.id;
    if (!isOwner && actor.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'No puedes cambiar este horario.');
    }
    return this.barbers.replaceSchedule(barberId, scheduleToRows(schedule));
  }

  async replaceOwnSchedule(actor: Actor, schedule: WeekSchedule) {
    const barber = await this.own(actor);
    return this.replaceSchedule(actor, barber.id, schedule);
  }

  async resetPassword(actor: Actor, id: string, password: string) {
    assertRole(actor, ['admin']);
    const barber = await this.require(id);
    await resetAccountPassword(actor.id, barber.userId, password);
  }

  async remove(actor: Actor, id: string) {
    assertRole(actor, ['admin']);
    await this.require(id);
    const upcoming = await this.barbers.countScheduled(id);
    if (upcoming > 0) {
      throw new DomainError('INVALID_STATE', 'Este barbero tiene citas programadas.');
    }
    await this.barbers.delete(id);
  }

  async availability(actor: Actor, barberId: string, date: string, duration: number) {
    assertRole(actor, ['client', 'admin']);
    const barber = await this.require(barberId);
    const rows = await this.barbers.scheduleRows(barber.id);
    const day = parseLocalDate(date);
    const row = rows.find((item) => item.dayOfWeek === day.getDay());
    if (!row || row.startMin == null || row.endMin == null) {
      return { slots: [] as { label: string; startsAt: string }[] };
    }

    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    const busy = await this.barbers.busyOnDay(barber.id, day, dayEnd);
    return {
      slots: buildSlots({
        day,
        startMin: row.startMin,
        endMin: row.endMin,
        duration,
        busy,
        now: new Date(),
      }),
    };
  }

  private async require(id: string): Promise<Barber> {
    const barber = await this.barbers.findById(id);
    if (!barber) throw new DomainError('NOT_FOUND', 'No encontramos ese barbero.');
    return barber;
  }

  private async requireByUser(userId: string): Promise<Barber> {
    const barber = await this.barbers.findByUserId(userId);
    if (!barber) throw new DomainError('NOT_FOUND', 'No tienes un perfil de barbero.');
    return barber;
  }

  private rethrowDuplicate(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new DomainError('DUPLICATE', 'Ya existe un usuario con ese documento.');
    }
    throw error;
  }
}
