import assert from 'node:assert/strict';
import test from 'node:test';
import { Prisma } from '@prisma/client';
import { createReadCache, isDatabaseUnavailable } from './read-cache';

function clock(start = 1_000) {
  let current = start;
  return {
    now: () => current,
    advance(ms: number) {
      current += ms;
    },
  };
}

test('una lectura repetida no vuelve a cargar', async () => {
  const cache = createReadCache();
  let loads = 0;
  const first = await cache.read('stats:admin', 30_000, async () => {
    loads += 1;
    return { visits: 2 };
  });
  const second = await cache.read('stats:admin', 30_000, async () => {
    loads += 1;
    return { visits: 9 };
  });
  assert.equal(loads, 1);
  assert.deepEqual(second, first);
});

test('al vencer el tiempo vuelve a cargar', async () => {
  const time = clock();
  const cache = createReadCache(time.now);
  await cache.read('salon:settings', 1_000, async () => ({ depositAmount: 10 }));
  time.advance(1_001);
  const fresh = await cache.read('salon:settings', 1_000, async () => ({ depositAmount: 20 }));
  assert.equal(fresh.depositAmount, 20);
});

test('un evento borra solo las claves de ese dato', async () => {
  const cache = createReadCache();
  await cache.read('appointments:ana', 30_000, async () => ['ana']);
  await cache.read('appointments:luis', 30_000, async () => ['luis']);
  await cache.read('inventory:admin', 30_000, async () => ['navaja']);
  cache.invalidate('appointments:ana');
  const ana = await cache.read('appointments:ana', 30_000, async () => ['ana-nueva']);
  const luis = await cache.read('appointments:luis', 30_000, async () => ['no']);
  const stock = await cache.read('inventory:admin', 30_000, async () => ['no']);
  assert.deepEqual(ana, ['ana-nueva']);
  assert.deepEqual(luis, ['luis']);
  assert.deepEqual(stock, ['navaja']);
});

test('quien recibe la copia no puede cambiar la que queda guardada', async () => {
  const cache = createReadCache();
  const first = await cache.read('inventory:client', 30_000, async () => ({ name: 'Cera' }));
  first.name = 'Cambiada';
  const second = await cache.read('inventory:client', 30_000, async () => ({ name: 'Otra' }));
  assert.equal(second.name, 'Cera');
});

test('si la base no responde se entrega la última copia buena', async () => {
  const time = clock();
  const cache = createReadCache(time.now);
  await cache.read('messages:ana:unread', 15_000, async () => [{ body: 'Hola' }]);
  time.advance(15_000);
  const stale = await cache.read('messages:ana:unread', 15_000, async () => {
    throw new Prisma.PrismaClientKnownRequestError('no llega', { code: 'P1001', clientVersion: 'test' });
  });
  assert.deepEqual(stale, [{ body: 'Hola' }]);
});

test('un error de negocio no se sustituye por la copia vieja', async () => {
  const time = clock();
  const cache = createReadCache(time.now);
  await cache.read('appointments:ana', 30_000, async () => ['cita']);
  time.advance(30_000);
  await assert.rejects(
    () => cache.read('appointments:ana', 30_000, async () => {
      throw new Error('Esta cita no es tuya.');
    }),
    /Esta cita no es tuya/,
  );
});

test('sin copia previa, la base caída sigue siendo un error', async () => {
  const cache = createReadCache();
  const error = new Prisma.PrismaClientInitializationError('sin base', '6.19.3');
  await assert.rejects(() => cache.read('stats:barber:1', 30_000, async () => {
    throw error;
  }));
  assert.equal(isDatabaseUnavailable(error), true);
});

test('la memoria suelta las copias más viejas cuando se llena', async () => {
  const cache = createReadCache();
  for (let index = 0; index < 301; index += 1) {
    await cache.read(`item:${index}`, 60_000, async () => index);
  }
  assert.equal(cache.size(), 300);
  const reloaded = await cache.read('item:0', 60_000, async () => 'otra vez');
  assert.equal(reloaded, 'otra vez');
});
