import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { CatalogService } from '@/server/modules/catalog/application/catalog.service';

const serviceSchema = z.object({
  name: z.string().trim().min(2, 'Escribe el nombre del servicio'),
  duration: z.number().int().positive('La duración debe ser mayor a cero'),
  price: z.number().positive('El precio debe ser mayor a cero'),
  description: z.string().trim().min(3, 'Escribe una descripción'),
});

export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  list(actor: Actor) {
    return this.catalog.list(actor);
  }

  create(actor: Actor, input: unknown) {
    return this.catalog.create(actor, serviceSchema.parse(input));
  }

  update(actor: Actor, id: string, input: unknown) {
    return this.catalog.update(actor, id, serviceSchema.parse(input));
  }

  remove(actor: Actor, id: string) {
    return this.catalog.remove(actor, id);
  }
}
