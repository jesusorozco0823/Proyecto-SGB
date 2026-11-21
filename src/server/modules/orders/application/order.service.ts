import type { Order } from '@/lib/types';
import type { Actor } from '@/server/shared/auth/actor';
import { invalidate } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import { writeAudit } from '@/server/shared/audit/write-audit';
import { canChangeStatus } from '@/server/modules/orders/domain/order-status';
import type { OrderUnitOfWork } from '@/server/modules/orders/application/ports';

export class OrderService {
  constructor(private readonly orders: OrderUnitOfWork) {}

  list(actor: Actor) {
    if (actor.role === 'admin') return this.orders.listAll();
    if (actor.role === 'client' || actor.role === 'barber') return this.orders.listByUser(actor.id);
    throw new DomainError('FORBIDDEN', 'No tienes permiso para ver pedidos.');
  }

  async place(actor: Actor, items: { itemId: string; quantity: number }[]) {
    if (actor.role !== 'client') {
      throw new DomainError('FORBIDDEN', 'Solo un cliente puede crear un pedido.');
    }
    if (await this.orders.isBlocked(actor.id)) {
      throw new DomainError('FORBIDDEN', 'Esta cuenta no puede comprar. Habla con el salón.');
    }

    const merged = new Map<string, number>();
    for (const item of items) {
      merged.set(item.itemId, (merged.get(item.itemId) ?? 0) + item.quantity);
    }

    const order = await this.orders.run(async (store) => {
      const products = await store.findItems([...merged.keys()]);
      if (products.length !== merged.size) {
        throw new DomainError('NOT_FOUND', 'Hay productos que ya no están disponibles.');
      }
      const threshold = await store.lowStockThreshold();

      const lines = [];
      for (const product of products) {
        const quantity = merged.get(product.id) ?? 0;
        const stock = await store.decrementIfAvailable(product.id, quantity);
        if (stock == null) {
          throw new DomainError('INSUFFICIENT_STOCK', `No hay stock suficiente de ${product.name}.`);
        }
        if (stock <= threshold) await store.recordLowStock(product.id, stock);
        lines.push({ itemId: product.id, quantity, price: product.price });
      }

      const total = Math.round(lines.reduce((sum, line) => sum + line.price * line.quantity, 0) * 100) / 100;
      return store.insert({ userId: actor.id, total, lines });
    });
    await writeAudit(actor.id, 'order.place', order.id);
    invalidate('inventory:', 'stats:', 'cash:');
    return order;
  }

  changeStatus(actor: Actor, id: string, status: Order['status']) {
    if (actor.role !== 'admin') {
      throw new DomainError('FORBIDDEN', 'Solo un administrador puede cambiar el estado del pedido.');
    }

    return this.orders.run(async (store) => {
      const order = await store.findById(id);
      if (!order) throw new DomainError('NOT_FOUND', 'No encontramos el pedido.');
      if (order.status === status) return order;
      if (!canChangeStatus(order.status, status)) {
        throw new DomainError('INVALID_STATE', 'Ese cambio de estado no está permitido.');
      }
      if (status === 'cancelled') {
        for (const item of order.items) {
          await store.increment(item.itemId, item.quantity);
        }
      }
      const updated = await store.setStatus(id, status);
      await writeAudit(actor.id, 'order.status', `${id}:${status}`);
      invalidate('inventory:', 'stats:', 'cash:');
      return updated;
    });
  }

  confirmPayment(actor: Actor, id: string) {
    if (actor.role !== 'admin') throw new DomainError('FORBIDDEN', 'Solo un administrador confirma el pago.');
    return this.orders.run(async (store) => {
      const order = await store.findById(id);
      if (!order) throw new DomainError('NOT_FOUND', 'No encontramos el pedido.');
      if (order.status === 'cancelled') throw new DomainError('INVALID_STATE', 'El pedido está cancelado.');
      const updated = await store.markPaid(id);
      await writeAudit(actor.id, 'order.pay', id);
      invalidate('stats:', 'cash:');
      return updated;
    });
  }

  async receipt(actor: Actor, id: string) {
    const order = await this.orders.findOwned(actor, id);
    return {
      kind: 'order' as const,
      id: order.id,
      when: order.createdAt,
      client: order.user.displayName,
      items: order.items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      total: order.total,
      paymentStatus: order.paymentStatus ?? 'pending',
      status: order.status,
    };
  }
}
