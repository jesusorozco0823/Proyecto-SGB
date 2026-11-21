import type { Actor } from '@/server/shared/auth/actor';
import { assertRole } from '@/server/shared/auth/authorize';
import { CacheTtl, cachedRead, invalidate } from '@/server/shared/cache/read-cache';
import { isUniqueViolation } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { InventoryDraft, InventoryRepository } from '@/server/modules/inventory/application/ports';

export class InventoryService {
  constructor(private readonly inventory: InventoryRepository) {}

  list(actor: Actor) {
    assertRole(actor, ['admin', 'client']);
    const key = actor.role === 'admin' ? 'inventory:admin' : 'inventory:client';
    return cachedRead(key, CacheTtl.lists, () => this.load(actor));
  }

  private async load(actor: Actor) {
    const items = await this.inventory.listActive();
    if (actor.role === 'admin') return items;
    return items.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      availability: (item.stock ?? 0) <= 0 ? 'agotado' as const : (item.stock ?? 0) <= 5 ? 'ultimas' as const : 'disponible' as const,
    }));
  }

  async create(actor: Actor, input: InventoryDraft) {
    assertRole(actor, ['admin']);
    try {
      const created = await this.inventory.create(input);
      invalidate('inventory:', 'stats:');
      return created;
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(actor: Actor, id: string, input: InventoryDraft) {
    assertRole(actor, ['admin']);
    try {
      const updated = await this.inventory.update(id, input);
      invalidate('inventory:', 'stats:');
      return updated;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new DomainError('DUPLICATE', 'Ya existe un producto con ese SKU.');
      }
      throw new DomainError('NOT_FOUND', 'No encontramos ese producto.');
    }
  }

  async remove(actor: Actor, id: string) {
    assertRole(actor, ['admin']);
    if (await this.inventory.countOrders(id) > 0) {
      await this.inventory.deactivate(id);
      invalidate('inventory:', 'stats:');
      return;
    }
    try {
      await this.inventory.delete(id);
      invalidate('inventory:', 'stats:');
    } catch {
      throw new DomainError('NOT_FOUND', 'No encontramos ese producto.');
    }
  }

  private rethrowDuplicate(error: unknown): never {
    if (isUniqueViolation(error)) {
      throw new DomainError('DUPLICATE', 'Ya existe un producto con ese SKU.');
    }
    throw error;
  }
}
