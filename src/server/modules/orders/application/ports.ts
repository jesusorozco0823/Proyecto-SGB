import type { Order } from '@/lib/types';

export type OrderLineView = Order['items'][number] & { name: string; imageUrl: string };

export type OrderView = Omit<Order, 'items' | 'createdAt'> & {
  createdAt: string;
  items: OrderLineView[];
  user: { id: string; displayName: string; documentNumber: string };
};

export type StockItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  active: boolean;
};

export type NewOrderLine = {
  itemId: string;
  quantity: number;
  price: number;
};

export interface OrderStore {
  findItems(ids: string[]): Promise<StockItem[]>;
  decrementIfAvailable(id: string, quantity: number): Promise<number | null>;
  increment(id: string, quantity: number): Promise<void>;
  lowStockThreshold(): Promise<number>;
  recordLowStock(itemId: string, stock: number): Promise<void>;
  insert(input: { userId: string; total: number; lines: NewOrderLine[] }): Promise<OrderView>;
  findById(id: string): Promise<OrderView | null>;
  setStatus(id: string, status: Order['status']): Promise<OrderView>;
  markPaid(id: string): Promise<OrderView>;
}

export interface OrderUnitOfWork {
  run<T>(work: (store: OrderStore) => Promise<T>): Promise<T>;
  listAll(): Promise<OrderView[]>;
  listByUser(userId: string): Promise<OrderView[]>;
  isBlocked(userId: string): Promise<boolean>;
  findOwned(actor: { id: string; role: string }, id: string): Promise<OrderView>;
}
