import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import type { Barber } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { emptyWeek } from '@/server/shared/time/schedule-time';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import { SalonService } from './salon.service';

const admin: Actor = { id: 'admin-1', role: 'admin', displayName: 'Hollman', documentNumber: '11111111', phone: null, preferences: [], avatarUrl: null };
const barberActor: Actor = { ...admin, id: 'user-barber', role: 'barber', displayName: 'Javier' };

function barber(id: string, name: string): Barber {
  const schedule = emptyWeek();
  schedule.monday = { start: '08:00 AM', end: '05:00 PM' };
  return { id, userId: `user-${id}`, name, documentNumber: '22222222', phone: '300', skills: [], schedule, rating: 5, imageUrl: 'https://placehold.co/400.png' };
}

function service(policy: { durationMinutes: number } | null, plans: { barberId: string; dayOfWeek: number; openMin: number; closeMin: number; lunchStartMin: number }[]) {
  const db = {
    lunchPolicy: { findUnique: async () => policy },
    dayPlan: { findMany: async () => plans },
  } as unknown as PrismaClient;
  const listed = [barber('b1', 'Javier'), barber('b2', 'Sam')];
  const barbers = { list: async () => listed } as unknown as BarberRepository;
  return new SalonService(db, barbers);
}

test('sin política el almuerzo se muestra en 60 minutos y solo en el barbero dueño del plan', async () => {
  const hours = await service(null, [
    { barberId: 'b1', dayOfWeek: 1, openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60 },
    { barberId: 'b2', dayOfWeek: 6, openMin: 9 * 60, closeMin: 14 * 60, lunchStartMin: 12 * 60 },
  ]).hours(admin);

  assert.equal(hours.lunchMinutes, 60);
  assert.equal(hours.barbers[0].plans[0].lunchStart, '11:00 AM');
  assert.equal(hours.barbers[0].plans[0].lunchEnd, '12:00 PM');
  assert.equal(hours.barbers[0].plans.length, 1);
  assert.equal(hours.barbers[1].plans[0].lunchEnd, '01:00 PM');
  assert.equal(hours.barbers[0].schedule.monday?.start, '08:00 AM');
});

test('la duración guardada mueve el fin del almuerzo sin cambiar la hora de inicio', async () => {
  const hours = await service({ durationMinutes: 90 }, [
    { barberId: 'b1', dayOfWeek: 1, openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60 + 30 },
  ]).hours(admin);
  assert.equal(hours.barbers[0].plans[0].lunchStart, '11:30 AM');
  assert.equal(hours.barbers[0].plans[0].lunchEnd, '01:00 PM');
});

test('un barbero no puede leer el horario de todo el salón', async () => {
  await assert.rejects(
    () => service(null, []).hours(barberActor),
    (error: unknown) => error instanceof DomainError && error.code === 'FORBIDDEN',
  );
});
