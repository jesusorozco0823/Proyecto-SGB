import assert from 'node:assert/strict';
import test from 'node:test';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import { assertLunchFits } from '@/server/modules/barbers/domain/turn-planner';
import type { AgendaRepository } from '@/server/modules/barbers/application/agenda.ports';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import { AgendaService } from './agenda.service';

const admin: Actor = { id: 'admin-1', role: 'admin', displayName: 'Hollman', documentNumber: '11111111', phone: null, preferences: [], avatarUrl: null };

function service() {
  let minutes = 60;
  const agenda = {
    lunchDuration: async () => minutes,
    setLunchDuration: async (value: number) => {
      minutes = value;
      return value;
    },
  } as unknown as AgendaRepository;
  return { agenda: new AgendaService(agenda, {} as BarberRepository), read: () => minutes };
}

test('el almuerzo acepta los extremos 15 y 120 y rechaza lo de afuera', async () => {
  const { agenda, read } = service();
  assert.equal((await agenda.updateLunch(admin, 15)).durationMinutes, 15);
  assert.equal(read(), 15);
  assert.equal((await agenda.updateLunch(admin, 120)).durationMinutes, 120);
  await assert.rejects(() => agenda.updateLunch(admin, 14), (error: unknown) => error instanceof DomainError && error.code === 'VALIDATION');
  await assert.rejects(() => agenda.updateLunch(admin, 121), (error: unknown) => error instanceof DomainError && error.code === 'VALIDATION');
  assert.equal(read(), 120);
});

test('el barbero consulta la duración y no la cambia', async () => {
  const { agenda, read } = service();
  const barber: Actor = { ...admin, role: 'barber' };
  assert.equal((await agenda.lunch(barber)).durationMinutes, 60);
  await assert.rejects(() => agenda.updateLunch(barber, 30), (error: unknown) => error instanceof DomainError && error.code === 'FORBIDDEN');
  assert.equal(read(), 60);
});

test('el bloque de almuerzo cabe exacto entre las 11 y las 2 y falla un minuto afuera o fuera de la jornada', () => {
  assert.deepEqual(assertLunchFits({ openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60, lunchDuration: 180 }).afternoon.startMin, 14 * 60);
  assert.throws(() => assertLunchFits({ openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60, lunchDuration: 181 }), /11:00/);
  assert.throws(() => assertLunchFits({ openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 10 * 60 + 59, lunchDuration: 60 }), /11:00/);
  assert.throws(() => assertLunchFits({ openMin: 12 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60, lunchDuration: 60 }), /jornada/);
  assert.throws(() => assertLunchFits({ openMin: 17 * 60, closeMin: 8 * 60, lunchStartMin: 12 * 60, lunchDuration: 60 }), /cierre/);
});
