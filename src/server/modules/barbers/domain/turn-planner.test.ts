import assert from 'node:assert/strict';
import test from 'node:test';
import { planExtraTurn, previewAgenda, type PlannerService } from './turn-planner';

const corte: PlannerService = { id: 'corte', name: 'Corte clásico', durationMinutes: 25, isSpecial: false };
const barba: PlannerService = { id: 'barba', name: 'Arreglo de barba', durationMinutes: 10, isSpecial: false };
const combo: PlannerService = { id: 'combo', name: 'Corte + barba', durationMinutes: 35, isSpecial: false };
const especial: PlannerService = { id: 'especial', name: 'Servicio especial', durationMinutes: 45, isSpecial: true };

const day = { openMin: 8 * 60, closeMin: 17 * 60, lunchStartMin: 12 * 60, lunchDuration: 60 };

test('servicios de la misma duración llenan mañana y tarde y dejan el sobrante solo al cierre', () => {
  const preview = previewAgenda({
    ...day,
    services: [corte, { ...corte, id: 'degradado', name: 'Degradado' }],
    counts: [],
  });

  assert.equal(preview.needsCounts, false);
  assert.equal(preview.turns.filter((turn) => !turn.isExtra).length, 18);
  assert.equal(preview.turns.filter((turn) => turn.startMin < 12 * 60).length, 9);
  assert.equal(preview.remainderMinutes, 15);
  assert.equal(preview.turns.every((turn) => turn.serviceId === null), true);
  assert.equal(preview.extra, null);
});

test('el almuerzo fuera de 11:00 a 14:00 se rechaza', () => {
  assert.throws(
    () => previewAgenda({ ...day, lunchStartMin: 10 * 60 + 30, services: [corte], counts: [] }),
    /11:00/,
  );
});

test('el servicio especial no puede cruzar el almuerzo', () => {
  assert.throws(
    () => previewAgenda({
      ...day,
      services: [especial, corte],
      counts: [{ serviceId: 'especial', count: 1 }, { serviceId: 'corte', count: 1 }],
      specialStartMin: 11 * 60 + 30,
    }),
    /no cabe/,
  );
});

test('un sobrante de 10 minutos con un servicio de 35 extiende la salida 25 minutos', () => {
  const extra = planExtraTurn(17 * 60, 10, combo);
  assert.equal(extra.startMin, 17 * 60 - 10);
  assert.equal(extra.extensionMinutes, 25);
  assert.equal(extra.effectiveCloseMin, 17 * 60 + 25);
});

test('un servicio que cabe exacto en el sobrante no mueve la salida', () => {
  const extra = planExtraTurn(17 * 60, 10, barba);
  assert.equal(extra.extensionMinutes, 0);
  assert.equal(extra.effectiveCloseMin, 17 * 60);
});

test('duraciones distintas piden cantidades y el turno especial usa la hora del barbero', () => {
  const preview = previewAgenda({
    ...day,
    services: [especial, combo, barba, corte],
    counts: [
      { serviceId: 'especial', count: 2 },
      { serviceId: 'combo', count: 2 },
      { serviceId: 'barba', count: 4 },
      { serviceId: 'corte', count: 0 },
    ],
    specialStartMin: 9 * 60,
  });

  const specialTurns = preview.turns.filter((turn) => turn.serviceId === 'especial');
  const placed = specialTurns.find((turn) => turn.placedByBarber);
  const following = specialTurns.find((turn) => !turn.placedByBarber);
  assert.equal(specialTurns.length, 2);
  assert.equal(placed?.startMin, 9 * 60);
  assert.equal(following?.startMin, 9 * 60 + 45);
  assert.equal(preview.turns.filter((turn) => turn.serviceId === 'combo').length, 2);
  assert.equal(preview.suggestions.some((line) => line.includes('caben hasta')), true);
});

test('el segundo servicio especial empieza después del primero', () => {
  const masaje: PlannerService = { id: 'masaje', name: 'Masaje', durationMinutes: 30, isSpecial: true };
  const preview = previewAgenda({
    ...day,
    services: [especial, masaje, corte],
    counts: [
      { serviceId: 'especial', count: 1 },
      { serviceId: 'masaje', count: 1 },
      { serviceId: 'corte', count: 1 },
    ],
    specialStartMin: 9 * 60,
  });

  const first = preview.turns.find((turn) => turn.serviceId === 'especial');
  const second = preview.turns.find((turn) => turn.serviceId === 'masaje');
  assert.equal(first?.startMin, 9 * 60);
  assert.equal(second?.startMin, 9 * 60 + 45);
});

test('el barbero puede mover la hora del segundo servicio especial', () => {
  const masaje: PlannerService = { id: 'masaje', name: 'Masaje', durationMinutes: 30, isSpecial: true };
  const preview = previewAgenda({
    ...day,
    services: [especial, masaje, corte],
    counts: [
      { serviceId: 'especial', count: 1 },
      { serviceId: 'masaje', count: 1 },
      { serviceId: 'corte', count: 1 },
    ],
    specialStartMin: 9 * 60,
    specialStarts: [{ serviceId: 'masaje', startMin: 11 * 60 }],
  });

  assert.equal(preview.turns.find((turn) => turn.serviceId === 'masaje')?.startMin, 11 * 60);
});
