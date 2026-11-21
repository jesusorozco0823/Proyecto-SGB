import type { InventoryItem as PrismaItem, PrismaClient } from '@prisma/client';
import type { InventoryItem } from '@/lib/types';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import type { InventoryDraft, InventoryRepository } from '@/server/modules/inventory/application/ports';

function toItem(item: PrismaItem): InventoryItem {
  return {
    id: item.id,
    sku: item.sku,
    name: item.name,
    stock: item.stock,
    price: decimalToNumber(item.price),
    imageUrl: item.imageUrl,
  };
}

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly db: PrismaClient) {}

  async listActive() {
    const items = await this.db.inventoryItem.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
    return items.map(toItem);
  }

  async create(input: InventoryDraft) {
    const item = await this.db.inventoryItem.create({ data: input });
    return toItem(item);
  }

  async update(id: string, input: InventoryDraft) {
    const item = await this.db.inventoryItem.update({ where: { id }, data: input });
    return toItem(item);
  }

  async countOrders(id: string) {
    return this.db.orderItem.count({ where: { itemId: id } });
  }

  async deactivate(id: string) {
    await this.db.inventoryItem.update({ where: { id }, data: { active: false } });
  }

  async delete(id: string) {
    await this.db.inventoryItem.delete({ where: { id } });
  }
}
