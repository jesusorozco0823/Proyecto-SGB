import assert from 'node:assert/strict';
import test from 'node:test';
import type { PrismaClient } from '@prisma/client';
import type { Barber } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import { emptyWeek } from '@/server/shared/time/schedule-time';
import type { AgendaRepository } from '@/server/modules/barbers/application/agenda.ports';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import { AgendaService } from '@/server/modules/barbers/application/agenda.service';
import { AgendaController } from '@/server/modules/barbers/presentation/agenda.controller';
import { SalonService } from './salon.service';

const admin: Actor = { id: 'admin-1', role: 'admin', displayName: 'Hollman', documentNumber: '11111111', phone: null, preferences: [], avatarUrl: null };

test('cambiar la duración del almuerzo se ve en el horario del barbero', async () => {
  let minutes = 60;
  const agenda = {
    setLunchDuration: async (value: number) => {
      minutes = value;
      return value;
    },
  } as unknown as AgendaRepository;
  const javier: Barber = {
    id: 'b1',
    userId: 'user-barber',
    name: 'Javier Rodriguez',
    documentNumber: '22222222',
    phone: '300',
    skills: [],
    schedule: emptyWeek(),
    rating: 5,
    imageUrl: 'https://placehold.co/400.png',
  };
  const db = {
    lunchPolicy: { findUnique: async () => ({ durationMinutes: minutes }) },
    dayPlan: {
      findMany: async () => [{ barberId: 'b1', dayOfWeek: 1, openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 11 * 60 }],
    },
  } as unknown as PrismaClient;
  const barbers = { list: async () => [javier] } as unknown as BarberRepository;

  const controller = new AgendaController(new AgendaService(agenda, {} as BarberRepository));
  const salon = new SalonService(db, barbers);

  await controller.updateLunch(admin, { durationMinutes: 45 });
  const board = await salon.hours(admin);

  assert.equal(board.lunchMinutes, 45);
  assert.equal(board.barbers[0].name, 'Javier Rodriguez');
  assert.equal(board.barbers[0].plans[0].open, '08:00 AM');
  assert.equal(board.barbers[0].plans[0].lunchStart, '11:00 AM');
  assert.equal(board.barbers[0].plans[0].lunchEnd, '11:45 AM');
});
