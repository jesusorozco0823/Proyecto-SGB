import assert from 'node:assert/strict';
import test from 'node:test';
import { formatDisplayTime, parseDisplayTime } from './schedule-time';

test('medianoche y mediodía no se confunden', () => {
  assert.equal(parseDisplayTime('12:00 AM'), 0);
  assert.equal(parseDisplayTime('12:00 PM'), 12 * 60);
  assert.equal(formatDisplayTime(0), '12:00 AM');
  assert.equal(formatDisplayTime(12 * 60), '12:00 PM');
});

test('la tarde suma doce horas y la mañana no', () => {
  assert.equal(parseDisplayTime('01:30 PM'), 13 * 60 + 30);
  assert.equal(parseDisplayTime('08:05 AM'), 8 * 60 + 5);
  assert.equal(formatDisplayTime(17 * 60), '05:00 PM');
});

test('rechaza horas imposibles y texto que no es una hora', () => {
  assert.throws(() => parseDisplayTime('00:30 AM'), /Hora inválida/);
  assert.throws(() => parseDisplayTime('13:00 PM'), /Hora inválida/);
  assert.throws(() => parseDisplayTime('08:60 AM'), /Hora inválida/);
  assert.throws(() => parseDisplayTime('08:00'), /Hora inválida/);
  assert.throws(() => parseDisplayTime(''), /Hora inválida/);
});

test('el formato acepta espacios y minúsculas', () => {
  assert.equal(parseDisplayTime('  9:05 pm '), 21 * 60 + 5);
});
