import assert from 'node:assert/strict';
import test from 'node:test';
import type { Barber } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { emptyWeek, type WeekSchedule } from '@/server/shared/time/schedule-time';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import type { ScheduleRow } from '@/server/modules/barbers/domain/schedule';
import { BarberService } from './barber.service';

const admin: Actor = { id: 'admin-1', role: 'admin', displayName: 'Hollman', documentNumber: '11111111', phone: null, preferences: [], avatarUrl: null };

function person(role: Actor['role'], id: string): Actor {
  return { ...admin, id, role, displayName: role };
}

function stored(userId: string): Barber {
  return {
    id: 'barber-1',
    userId,
    name: 'Javier',
    documentNumber: '22222222',
    phone: '300',
    skills: ['Corte'],
    schedule: emptyWeek(),
    rating: 5,
    imageUrl: 'https://placehold.co/400.png',
  };
}

function harness(found: Barber | null) {
  const saved: ScheduleRow[][] = [];
  const repo = {
    findById: async () => found,
    list: async () => (found ? [found] : []),
    replaceSchedule: async (_id: string, rows: ScheduleRow[]) => {
      saved.push(rows);
      return emptyWeek();
    },
  } as unknown as BarberRepository;
  return { service: new BarberService(repo, { hash: async () => 'x', verify: async () => false }), saved };
}

function openMonday(): WeekSchedule {
  const week = emptyWeek();
  week.monday = { start: '08:00 AM', end: '05:00 PM' };
  return week;
}

test('el administrador guarda la jornada en minutos', async () => {
  const { service, saved } = harness(stored('user-barber'));
  await service.replaceSchedule(admin, 'barber-1', openMonday());
  assert.equal(saved.length, 1);
  assert.deepEqual(saved[0][1], { dayOfWeek: 1, startMin: 8 * 60, endMin: 17 * 60 });
});

test('el barbero dueño puede guardar y otro barbero no llega al repositorio', async () => {
  const owner = harness(stored('user-barber'));
  await owner.service.replaceSchedule(person('barber', 'user-barber'), 'barber-1', openMonday());
  assert.equal(owner.saved.length, 1);

  const other = harness(stored('user-barber'));
  await assert.rejects(
    () => other.service.replaceSchedule(person('barber', 'otro'), 'barber-1', openMonday()),
    (error: unknown) => error instanceof DomainError && error.code === 'FORBIDDEN',
  );
  assert.equal(other.saved.length, 0);
});

test('el cliente no cambia horarios y un barbero inexistente responde no encontrado', async () => {
  const { service, saved } = harness(stored('user-barber'));
  await assert.rejects(
    () => service.replaceSchedule(person('client', 'client-1'), 'barber-1', openMonday()),
    (error: unknown) => error instanceof DomainError && error.code === 'FORBIDDEN',
  );
  const missing = harness(null);
  await assert.rejects(
    () => missing.service.replaceSchedule(admin, 'nadie', openMonday()),
    (error: unknown) => error instanceof DomainError && error.code === 'NOT_FOUND',
  );
  assert.equal(saved.length, 0);
});

test('el listado público oculta documento, teléfono y horario', async () => {
  const { service } = harness(stored('user-barber'));
  const [visible] = await service.list(person('client', 'client-1'));
  assert.equal(visible.documentNumber, '');
  assert.equal(visible.phone, '');
  assert.equal(visible.schedule.monday, null);
  const [full] = await service.list(admin);
  assert.equal(full.documentNumber, '22222222');
});
