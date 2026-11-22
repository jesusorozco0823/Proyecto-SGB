import assert from 'node:assert/strict';
import test from 'node:test';
import { formatCop } from './money';

test('los pesos se muestran sin centavos y con separador de miles', () => {
  assert.match(formatCop(10000), /10\.000/);
  assert.match(formatCop(0), /\$\s*0/);
  assert.equal(formatCop(10.4), formatCop(10));
  assert.equal(formatCop(10.5), formatCop(11));
});
