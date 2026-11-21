import type { InventoryItem } from '@/lib/types';

export type InventoryDraft = {
  sku: string;
  name: string;
  stock: number;
  price: number;
  imageUrl: string;
};

export interface InventoryRepository {
  listActive(): Promise<InventoryItem[]>;
  create(input: InventoryDraft): Promise<InventoryItem>;
  update(id: string, input: InventoryDraft): Promise<InventoryItem>;
  countOrders(id: string): Promise<number>;
  deactivate(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
