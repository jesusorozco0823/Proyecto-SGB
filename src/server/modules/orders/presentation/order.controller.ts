import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { OrderService } from '@/server/modules/orders/application/order.service';

const placeSchema = z.object({
  items: z
    .array(
      z.object({
        itemId: z.string().min(1),
        quantity: z.number().int().min(1, 'La cantidad debe ser al menos 1').max(5, 'El máximo por producto es 5'),
      }),
    )
    .min(1, 'El carrito está vacío')
    .max(8, 'El pedido admite hasta 8 productos'),
});

const statusSchema = z.object({
  status: z.enum(['pending', 'shipped', 'delivered', 'cancelled']),
});

export class OrderController {
  constructor(private readonly orders: OrderService) {}

  list(actor: Actor) {
    return this.orders.list(actor);
  }

  place(actor: Actor, input: unknown) {
    return this.orders.place(actor, placeSchema.parse(input).items);
  }

  changeStatus(actor: Actor, id: string, input: unknown) {
    return this.orders.changeStatus(actor, id, statusSchema.parse(input).status);
  }

  confirmPayment(actor: Actor, id: string) {
    return this.orders.confirmPayment(actor, id);
  }

  receipt(actor: Actor, id: string) {
    return this.orders.receipt(actor, id);
  }
}
