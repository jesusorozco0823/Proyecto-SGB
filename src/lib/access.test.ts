import assert from 'node:assert/strict';
import test from 'node:test';
import { canAccess } from './access';

test('el panel común está abierto para los cuatro roles', () => {
  for (const role of ['admin', 'superadmin', 'barber', 'client'] as const) {
    assert.equal(canAccess(role, '/dashboard'), true);
  }
});

test('solo el administrador entra al horario del salón', () => {
  assert.equal(canAccess('admin', '/dashboard/hours'), true);
  assert.equal(canAccess('admin', '/dashboard/hours/extra'), true);
  assert.equal(canAccess('barber', '/dashboard/hours'), false);
  assert.equal(canAccess('client', '/dashboard/hours'), false);
  assert.equal(canAccess('superadmin', '/dashboard/hours'), false);
});

test('cada rol se queda en sus módulos', () => {
  assert.equal(canAccess('client', '/dashboard/book'), true);
  assert.equal(canAccess('client', '/dashboard/barbers'), false);
  assert.equal(canAccess('barber', '/dashboard/schedule'), true);
  assert.equal(canAccess('barber', '/dashboard/inventory'), false);
  assert.equal(canAccess('admin', '/dashboard/schedule'), false);
  assert.equal(canAccess('superadmin', '/dashboard/audit'), true);
  assert.equal(canAccess('superadmin', '/dashboard/barbers'), false);
});
