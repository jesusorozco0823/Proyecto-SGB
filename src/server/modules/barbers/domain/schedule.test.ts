import assert from 'node:assert/strict';
import test from 'node:test';
import { DomainError } from '@/server/shared/errors/domain-error';
import { emptyWeek } from '@/server/shared/time/schedule-time';
import { assertInsideShift, buildSlots, rowsToSchedule, scheduleToRows } from './schedule';

test('un día cerrado y un día abierto vuelven a la misma semana', () => {
  const schedule = rowsToSchedule([
    { dayOfWeek: 0, startMin: null, endMin: null },
    { dayOfWeek: 1, startMin: 8 * 60, endMin: 17 * 60 },
    { dayOfWeek: 9, startMin: 8 * 60, endMin: 9 * 60 },
  ]);
  assert.equal(schedule.sunday, null);
  assert.deepEqual(schedule.monday, { start: '08:00 AM', end: '05:00 PM' });
  assert.equal(schedule.tuesday, null);
});

test('el cierre igual o anterior a la apertura no se guarda', () => {
  const week = emptyWeek();
  week.monday = { start: '05:00 PM', end: '08:00 AM' };
  assert.throws(
    () => scheduleToRows(week),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_SCHEDULE',
  );
});

test('una hora suelta sin AM o PM se rechaza antes de tocar la base', () => {
  const week = emptyWeek();
  week.friday = { start: '08:00', end: '17:00' };
  assert.throws(
    () => scheduleToRows(week),
    (error: unknown) => error instanceof DomainError && /friday/.test(error.message),
  );
});

test('la semana válida queda en minutos y el domingo cerrado queda nulo', () => {
  const week = emptyWeek();
  week.saturday = { start: '09:00 AM', end: '01:00 PM' };
  const rows = scheduleToRows(week);
  assert.deepEqual(rows[6], { dayOfWeek: 6, startMin: 9 * 60, endMin: 13 * 60 });
  assert.deepEqual(rows[0], { dayOfWeek: 0, startMin: null, endMin: null });
});

test('no ofrece turnos pasados, ocupados ni más largos que la jornada', () => {
  const day = new Date(2026, 10, 21, 0, 0, 0, 0);
  const now = new Date(2026, 10, 21, 8, 0, 0, 0);
  const slots = buildSlots({
    day,
    startMin: 8 * 60,
    endMin: 11 * 60,
    duration: 60,
    now,
    busy: [{ startsAt: new Date(2026, 10, 21, 9, 0, 0, 0), endsAt: new Date(2026, 10, 21, 9, 30, 0, 0) }],
  });
  assert.deepEqual(slots.map((slot) => slot.label), ['09:30 AM', '10:00 AM']);
  assert.deepEqual(buildSlots({ day, startMin: 8 * 60, endMin: 9 * 60, duration: 90, now, busy: [] }), []);
});

test('una cita que termina justo al cierre cabe y un minuto más no', () => {
  const rows = [{ dayOfWeek: 6, startMin: 9 * 60, endMin: 13 * 60 }];
  const start = new Date(2026, 10, 21, 12, 0, 0, 0);
  const exact = new Date(2026, 10, 21, 13, 0, 0, 0);
  assert.doesNotThrow(() => assertInsideShift(rows, start, exact));
  assert.throws(
    () => assertInsideShift(rows, start, new Date(exact.getTime() + 60_000)),
    (error: unknown) => error instanceof DomainError && error.code === 'INVALID_STATE',
  );
  assert.throws(
    () => assertInsideShift(rows, new Date(2026, 10, 22, 10, 0, 0, 0), new Date(2026, 10, 22, 11, 0, 0, 0)),
    /no trabaja/,
  );
});
