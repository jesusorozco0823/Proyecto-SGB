import assert from 'node:assert/strict';
import test from 'node:test';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { emptyWeek } from '@/server/shared/time/schedule-time';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import type { AgendaRepository } from '@/server/modules/barbers/application/agenda.ports';
import { AgendaService } from '@/server/modules/barbers/application/agenda.service';
import { AgendaController } from '@/server/modules/barbers/presentation/agenda.controller';
import { BarberService } from '@/server/modules/barbers/application/barber.service';
import { BarberController } from '@/server/modules/barbers/presentation/barber.controller';
import { SalonController } from './salon.controller';
import type { SalonService } from '@/server/modules/salon/application/salon.service';

const admin: Actor = { id: 'admin-1', role: 'admin', displayName: 'Hollman', documentNumber: '11111111', phone: null, preferences: [], avatarUrl: null };

function lunchController() {
  let minutes = 60;
  const agenda = {
    lunchDuration: async () => minutes,
    setLunchDuration: async (value: number) => {
      minutes = value;
      return value;
    },
  } as unknown as AgendaRepository;
  return new AgendaController(new AgendaService(agenda, {} as BarberRepository));
}

async function expectZod(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (error) {
    assert.equal(typeof error === 'object' && error !== null && 'issues' in error, true);
    return;
  }
  assert.fail('La entrada inválida fue aceptada.');
}

test('la duración del almuerzo solo entra como entero entre 15 y 120', async () => {
  const controller = lunchController();
  assert.equal((await controller.updateLunch(admin, { durationMinutes: 15 })).durationMinutes, 15);
  assert.equal((await controller.updateLunch(admin, { durationMinutes: 120 })).durationMinutes, 120);
  await assert.rejects(() => controller.updateLunch(admin, { durationMinutes: 14 }), (error: unknown) => error instanceof DomainError);
  await assert.rejects(() => controller.updateLunch(admin, { durationMinutes: 121 }), (error: unknown) => error instanceof DomainError);
  await expectZod(() => controller.updateLunch(admin, { durationMinutes: 30.5 }));
  await expectZod(() => controller.updateLunch(admin, { durationMinutes: '60' }));
  await expectZod(() => controller.updateLunch(admin, {}));
  await expectZod(() => controller.updateLunch(admin, null));
});

test('los ajustes del salón rechazan abono negativo, comisión fuera de rango y almuerzo vacío', async () => {
  let called = 0;
  const salon = {
    updateSettings: async (_actor: Actor, input: { durationMinutes: number }) => {
      called += 1;
      return input;
    },
  } as unknown as SalonService;
  const controller = new SalonController(salon);
  const valid = { durationMinutes: 60, depositAmount: 10000, commissionPercent: 40, lowStockThreshold: 5 };
  await controller.updateSettings(admin, valid);
  assert.equal(called, 1);
  await expectZod(() => controller.updateSettings(admin, { ...valid, depositAmount: -1 }));
  await expectZod(() => controller.updateSettings(admin, { ...valid, commissionPercent: 101 }));
  await expectZod(() => controller.updateSettings(admin, { ...valid, commissionPercent: 40.5 }));
  await expectZod(() => controller.updateSettings(admin, { ...valid, lowStockThreshold: -1 }));
  await expectZod(() => controller.updateSettings(admin, { ...valid, durationMinutes: 0 }));
  await expectZod(() => controller.updateSettings(admin, { depositAmount: 0, commissionPercent: 0, lowStockThreshold: 0 }));
  assert.equal(called, 1);
});

test('el horario semanal exige los siete días y una hora de cierre posterior', async () => {
  const week = emptyWeek();
  week.monday = { start: '08:00 AM', end: '05:00 PM' };
  let saved = 0;
  const barbers = {
    findById: async () => ({
      id: 'barber-1',
      userId: 'user-barber',
      name: 'Javier',
      documentNumber: '22222222',
      phone: '300',
      skills: [],
      schedule: emptyWeek(),
      rating: 5,
      imageUrl: 'https://placehold.co/400.png',
    }),
    replaceSchedule: async () => {
      saved += 1;
      return emptyWeek();
    },
  } as unknown as BarberRepository;
  const controller = new BarberController(new BarberService(barbers, { hash: async () => 'x', verify: async () => true }));
  await controller.replaceSchedule(admin, 'barber-1', week);
  assert.equal(saved, 1);

  const backwards = { ...week, tuesday: { start: '05:00 PM', end: '08:00 AM' } };
  await assert.rejects(
    () => controller.replaceSchedule(admin, 'barber-1', backwards),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_SCHEDULE',
  );
  const { monday: _ignored, ...withoutMonday } = week;
  await expectZod(() => controller.replaceSchedule(admin, 'barber-1', withoutMonday));
  await expectZod(() => controller.replaceSchedule(admin, 'barber-1', { ...week, saturday: { start: '', end: '01:00 PM' } }));
  assert.equal(saved, 1);
});
