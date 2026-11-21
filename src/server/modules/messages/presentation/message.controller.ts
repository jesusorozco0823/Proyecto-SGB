import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { MessageService } from '@/server/modules/messages/application/message.service';

const sendSchema = z.object({
  recipientId: z.string().min(1, 'Elige a quién le escribes.'),
  body: z.string().trim().min(1, 'Escribe un mensaje.').max(500, 'El mensaje admite 500 caracteres.'),
});

export class MessageController {
  constructor(private readonly messages: MessageService) {}

  contacts(actor: Actor) {
    return this.messages.contacts(actor);
  }

  thread(actor: Actor, otherId: string) {
    return this.messages.thread(actor, otherId);
  }

  send(actor: Actor, input: unknown) {
    return this.messages.send(actor, sendSchema.parse(input));
  }

  unread(actor: Actor) {
    return this.messages.unread(actor);
  }
}
