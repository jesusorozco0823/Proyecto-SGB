import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_VISIBLE_STATUSES, CREDIT_STATUSES, hiddenFromAdmin } from '@/server/modules/credits/domain/credit';

test('el administrador no ve un crédito hasta que el barbero acepta', () => {
  assert.equal(hiddenFromAdmin('pending_barber'), true);
  assert.equal(hiddenFromAdmin('barber_rejected'), true);
  for (const status of ADMIN_VISIBLE_STATUSES) {
    assert.equal(hiddenFromAdmin(status), false);
  }
});

test('cada estado es visible para el administrador o se le esconde', () => {
  const visible = new Set<string>(ADMIN_VISIBLE_STATUSES);
  for (const status of CREDIT_STATUSES) {
    assert.equal(hiddenFromAdmin(status), !visible.has(status));
  }
});
