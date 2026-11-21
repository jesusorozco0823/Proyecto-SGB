import { z } from 'zod';
import { AuthService } from '@/server/modules/auth/application/auth.service';

const password = z.string().min(8, 'La contraseña debe tener al menos 8 caracteres').max(72, 'La contraseña es demasiado larga');

const registerSchema = z.object({
  displayName: z.string().trim().min(2, 'Escribe tu nombre'),
  phone: z.string().trim().min(7, 'Escribe un teléfono válido'),
  documentNumber: z.string().trim().min(5, 'El documento es demasiado corto'),
  password,
});

const loginSchema = z.object({
  documentNumber: z.string().trim().min(5, 'El documento es demasiado corto'),
  password,
});

const mfaSchema = z.object({
  challenge: z.string().min(1),
  code: z.string().trim().min(6).max(8),
});

export class AuthController {
  constructor(private readonly auth: AuthService) {}

  register(input: unknown) {
    return this.auth.register(registerSchema.parse(input));
  }

  login(input: unknown) {
    return this.auth.login(loginSchema.parse(input));
  }

  confirmMfa(input: unknown) {
    const data = mfaSchema.parse(input);
    return this.auth.confirmMfa(data.challenge, data.code);
  }
}
