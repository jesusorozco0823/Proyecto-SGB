import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { ProfileService } from '@/server/modules/profile/application/profile.service';

const updateSchema = z.object({
  displayName: z.string().trim().min(2, 'Escribe tu nombre').optional(),
  phone: z.string().trim().min(7, 'Escribe un teléfono válido').optional(),
  preferences: z.array(z.string().trim().min(1).max(40, 'Cada preferencia admite 40 caracteres')).max(20, 'Puedes guardar hasta 20 preferencias').optional(),
  avatarUrl: z.string().trim().max(500).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'No hay cambios para guardar.' });

export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  update(actor: Actor, input: unknown) {
    return this.profiles.update(actor, updateSchema.parse(input));
  }
}
