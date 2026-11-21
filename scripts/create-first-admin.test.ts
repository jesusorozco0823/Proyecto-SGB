import assert from 'node:assert/strict';
import test from 'node:test';
import { productionDatabaseHost, readEnvFile } from './create-first-admin';

test('lee el archivo de producción sin confundir comentarios', () => {
  const values = readEnvFile('# nota\nDATABASE_URL="postgresql://sgb:secreto@ep.neon.tech/sgb"\nADMIN_DOCUMENT=123456\n');
  assert.equal(values.DATABASE_URL, 'postgresql://sgb:secreto@ep.neon.tech/sgb');
  assert.equal(values.ADMIN_DOCUMENT, '123456');
});

test('rechaza la base de desarrollo', () => {
  assert.throws(() => productionDatabaseHost('postgresql://sgb:sgb@localhost:5434/sgb'), /computador/);
  assert.throws(() => productionDatabaseHost('postgresql://sgb:sgb@127.0.0.1:5432/sgb'), /computador/);
});

test('acepta un servidor remoto', () => {
  assert.equal(
    productionDatabaseHost('postgresql://sgb:secreto@ep-ejemplo.us-east-1.aws.neon.tech/sgb?sslmode=require'),
    'ep-ejemplo.us-east-1.aws.neon.tech',
  );
});
