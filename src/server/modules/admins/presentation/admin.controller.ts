import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { AdminService } from '@/server/modules/admins/application/admin.service';

const createSchema = z.object({
  displayName: z.string().trim().min(2, 'Escribe el nombre'),
  documentNumber: z.string().trim().min(5, 'El documento es demasiado corto'),
  phone: z.string().trim().min(7, 'Escribe un teléfono válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

const updateSchema = createSchema.omit({ password: true });

export class AdminController {
  constructor(private readonly admins: AdminService) {}

  list(actor: Actor) {
    return this.admins.list(actor);
  }

  create(actor: Actor, input: unknown) {
    return this.admins.create(actor, createSchema.parse(input));
  }

  update(actor: Actor, id: string, input: unknown) {
    return this.admins.update(actor, id, updateSchema.parse(input));
  }

  remove(actor: Actor, id: string) {
    return this.admins.remove(actor, id);
  }

  resetPassword(actor: Actor, id: string, input: unknown) {
    const password = z.object({ password: z.string().min(8).max(72) }).parse(input).password;
    return this.admins.resetPassword(actor, id, password);
  }
}
