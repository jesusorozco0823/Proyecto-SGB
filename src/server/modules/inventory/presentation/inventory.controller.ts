import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { assertImageUrl } from '@/server/shared/http/image-url';
import { InventoryService } from '@/server/modules/inventory/application/inventory.service';

const itemSchema = z.object({
  sku: z.string().trim().min(1, 'El SKU es obligatorio'),
  name: z.string().trim().min(2, 'Escribe el nombre'),
  stock: z.number().int().nonnegative('El stock no puede ser negativo'),
  price: z.number().positive('El precio debe ser mayor a cero'),
  imageUrl: z.string().trim().optional(),
});

const DEFAULT_IMAGE = 'https://placehold.co/200x200.png';

export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  list(actor: Actor) {
    return this.inventory.list(actor);
  }

  create(actor: Actor, input: unknown) {
    const data = itemSchema.parse(input);
    return this.inventory.create(actor, { ...data, imageUrl: data.imageUrl ? assertImageUrl(data.imageUrl) : DEFAULT_IMAGE });
  }

  update(actor: Actor, id: string, input: unknown) {
    const data = itemSchema.parse(input);
    return this.inventory.update(actor, id, { ...data, imageUrl: data.imageUrl ? assertImageUrl(data.imageUrl) : DEFAULT_IMAGE });
  }

  remove(actor: Actor, id: string) {
    return this.inventory.remove(actor, id);
  }
}
