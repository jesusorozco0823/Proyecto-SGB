import assert from 'node:assert/strict';
import test from 'node:test';
import type { Actor } from '@/server/shared/auth/actor';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { CreditRecord, CreditRepository } from '@/server/modules/credits/application/ports';
import { CreditService } from '@/server/modules/credits/application/credit.service';

const admin: Actor = {
  id: 'admin-1',
  role: 'admin',
  displayName: 'Admin Principal',
  documentNumber: '11111111',
  phone: null,
  preferences: [],
  avatarUrl: null,
};

function record(status: CreditRecord['status']): CreditRecord {
  return {
    id: 'credit-1',
    clientId: 'client-1',
    clientName: 'Alex Campos',
    barberId: 'barber-1',
    barberName: 'Javier',
    barberUserId: 'user-barber',
    kind: 'owed',
    note: null,
    status,
    measure: null,
    limitCuts: null,
    limitAmount: null,
    usedCuts: 0,
    usedAmount: 0,
    createdAt: new Date('2026-11-21T12:00:00Z'),
  };
}

function repo(row: CreditRecord): CreditRepository & { adminListed: number; barberListed: number } {
  const fake = {
    adminListed: 0,
    barberListed: 0,
    barbersForClient: async () => [],
    barberIdForUser: async () => 'barber-1',
    openForPair: async () => false,
    create: async () => row,
    require: async () => row,
    listForClient: async () => [],
    listForBarber: async () => {
      fake.barberListed += 1;
      return [row];
    },
    listForAdmin: async () => {
      fake.adminListed += 1;
      return [];
    },
    usersByRole: async () => [],
    markBarber: async () => row,
    markAdmin: async () => row,
    chargeable: async () => [],
    charge: async () => row,
    tell: async () => undefined,
  };
  return fake;
}

test('el listado del administrador no consulta los pedidos del barbero', async () => {
  const credits = repo(record('pending_barber'));
  const service = new CreditService(credits);
  await service.list(admin);
  assert.equal(credits.adminListed, 1);
  assert.equal(credits.barberListed, 0);
});

test('el administrador no decide un pedido que el barbero no aceptó', async () => {
  const service = new CreditService(repo(record('pending_barber')));
  await assert.rejects(
    () => service.adminDecide(admin, 'credit-1', { answer: 'rejected' }),
    (error: unknown) => error instanceof DomainError && error.code === 'NOT_FOUND',
  );
});

test('el administrador no decide un pedido que el barbero rechazó', async () => {
  const service = new CreditService(repo(record('barber_rejected')));
  await assert.rejects(
    () => service.adminDecide(admin, 'credit-1', { answer: 'approved', measure: 'cuts', limit: 4 }),
    (error: unknown) => error instanceof DomainError && error.code === 'NOT_FOUND',
  );
});
