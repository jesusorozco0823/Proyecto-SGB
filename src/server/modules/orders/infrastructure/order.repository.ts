import type { Prisma, PrismaClient } from '@prisma/client';
import { decimalToNumber } from '@/server/shared/database/prisma-errors';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { NewOrderLine, OrderStore, OrderUnitOfWork, OrderView, StockItem } from '@/server/modules/orders/application/ports';

const include = {
  user: true,
  items: { include: { item: true } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof include }>;

function toView(order: OrderRow): OrderView {
  return {
    id: order.id,
    userId: order.userId,
    total: decimalToNumber(order.total),
    status: order.status,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt.toISOString(),
    user: {
      id: order.user.id,
      displayName: order.user.displayName,
      documentNumber: order.user.documentNumber,
    },
    items: order.items.map((line) => ({
      itemId: line.itemId,
      quantity: line.quantity,
      price: decimalToNumber(line.price),
      name: line.item.name,
      imageUrl: line.item.imageUrl,
    })),
  };
}

class TransactionOrderStore implements OrderStore {
  constructor(private readonly tx: Prisma.TransactionClient) {}

  async findItems(ids: string[]): Promise<StockItem[]> {
    const items = await this.tx.inventoryItem.findMany({ where: { id: { in: ids }, active: true } });
    return items.map((item) => ({
      id: item.id,
      name: item.name,
      price: decimalToNumber(item.price),
      imageUrl: item.imageUrl,
      active: item.active,
    }));
  }

  async decrementIfAvailable(id: string, quantity: number) {
    const result = await this.tx.inventoryItem.updateMany({
      where: { id, active: true, stock: { gte: quantity } },
      data: { stock: { decrement: quantity } },
    });
    if (result.count !== 1) return null;
    const item = await this.tx.inventoryItem.findUnique({ where: { id }, select: { stock: true } });
    return item?.stock ?? null;
  }

  async lowStockThreshold() {
    const policy = await this.tx.lunchPolicy.findUnique({ where: { id: 'default' } });
    return policy?.lowStockThreshold ?? 5;
  }

  async recordLowStock(itemId: string, stock: number) {
    await this.tx.stockAlert.create({ data: { itemId, stock } });
  }

  async increment(id: string, quantity: number) {
    await this.tx.inventoryItem.update({
      where: { id },
      data: { stock: { increment: quantity } },
    });
  }

  async insert(input: { userId: string; total: number; lines: NewOrderLine[] }) {
    const order = await this.tx.order.create({
      data: {
        userId: input.userId,
        total: input.total,
        items: { create: input.lines },
      },
      include,
    });
    return toView(order);
  }

  async findById(id: string) {
    const order = await this.tx.order.findUnique({ where: { id }, include });
    return order ? toView(order) : null;
  }

  async setStatus(id: string, status: OrderView['status']) {
    const order = await this.tx.order.update({ where: { id }, data: { status }, include });
    return toView(order);
  }

  async markPaid(id: string) {
    const order = await this.tx.order.update({ where: { id }, data: { paymentStatus: 'paid' }, include });
    return toView(order);
  }
}

export class PrismaOrderRepository implements OrderUnitOfWork {
  constructor(private readonly db: PrismaClient) {}

  run<T>(work: (store: OrderStore) => Promise<T>) {
    return this.db.$transaction((tx) => work(new TransactionOrderStore(tx)));
  }

  listAll() {
    return this.list({});
  }

  listByUser(userId: string) {
    return this.list({ userId });
  }

  async isBlocked(userId: string) {
    const user = await this.db.user.findUnique({ where: { id: userId }, select: { blockedAt: true } });
    return Boolean(user?.blockedAt);
  }

  async findOwned(actor: { id: string; role: string }, id: string) {
    const order = await this.db.order.findUnique({ where: { id }, include });
    if (!order) throw new DomainError('NOT_FOUND', 'No encontramos el pedido.');
    const view = toView(order);
    const allowed = actor.role === 'admin' || actor.role === 'superadmin' || view.userId === actor.id;
    if (!allowed) throw new DomainError('FORBIDDEN', 'No puedes ver este comprobante.');
    return view;
  }

  private async list(where: Prisma.OrderWhereInput) {
    const rows = await this.db.order.findMany({ where, include, orderBy: { createdAt: 'desc' } });
    return rows.map(toView);
  }
}
