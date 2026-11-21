import type { Actor } from '@/server/shared/auth/actor';
import { CacheTtl, cachedRead, invalidate } from '@/server/shared/cache/read-cache';
import { DomainError } from '@/server/shared/errors/domain-error';
import type { ChatUser, MessageRepository } from '@/server/modules/messages/application/ports';

const DAY_MS = 24 * 60 * 60 * 1000;

function cutoff() {
  return new Date(Date.now() - DAY_MS);
}

export class MessageService {
  constructor(private readonly messages: MessageRepository) {}

  contacts(actor: Actor) {
    return cachedRead(`messages:${actor.id}:contacts`, CacheTtl.messages, () => this.loadContacts(actor));
  }

  private async loadContacts(actor: Actor) {
    await this.messages.purgeExpired(cutoff());
    const [people, activity] = await Promise.all([
      this.allowed(actor),
      this.messages.activity(actor.id, cutoff()),
    ]);
    return people
      .filter((person) => person.id !== actor.id)
      .map((person) => {
        const state = activity.get(person.id) ?? { incoming: 0, outgoingUnread: 0 };
        return { ...person, incoming: state.incoming, pending: state.outgoingUnread > 0 };
      })
      .sort((left, right) => {
        const leftHot = left.incoming > 0 || left.pending ? 1 : 0;
        const rightHot = right.incoming > 0 || right.pending ? 1 : 0;
        if (leftHot !== rightHot) return rightHot - leftHot;
        return left.displayName.localeCompare(right.displayName, 'es');
      });
  }

  thread(actor: Actor, otherId: string) {
    return cachedRead(`messages:${actor.id}:thread:${otherId}`, CacheTtl.messages, () => this.loadThread(actor, otherId));
  }

  private async loadThread(actor: Actor, otherId: string) {
    await this.messages.purgeExpired(cutoff());
    const other = await this.requireAllowed(actor, otherId);
    const marked = await this.messages.markRead(actor.id, other.id);
    if (marked > 0) {
      invalidate(`messages:${actor.id}:contacts`, `messages:${actor.id}:unread`, `messages:${other.id}:`);
    }
    const messages = await this.messages.thread(actor.id, other.id, cutoff());
    return {
      contact: other,
      messages: messages.map((message) => ({
        id: message.id,
        body: message.body,
        mine: message.senderId === actor.id,
        read: Boolean(message.readAt),
        createdAt: message.createdAt,
      })),
    };
  }

  async send(actor: Actor, input: { recipientId: string; body: string }) {
    await this.messages.purgeExpired(cutoff());
    const other = await this.requireAllowed(actor, input.recipientId);
    const saved = await this.messages.create({ senderId: actor.id, recipientId: other.id, body: input.body });
    invalidate(`messages:${actor.id}:`, `messages:${other.id}:`);
    return { id: saved.id, body: saved.body, mine: true, read: false, createdAt: saved.createdAt };
  }

  unread(actor: Actor) {
    return cachedRead(`messages:${actor.id}:unread`, CacheTtl.messages, () => this.loadUnread(actor));
  }

  private async loadUnread(actor: Actor) {
    await this.messages.purgeExpired(cutoff());
    const rows = await this.messages.unread(actor.id, cutoff());
    return rows.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      senderName: row.senderName,
      body: row.body,
      createdAt: row.createdAt,
    }));
  }

  private async allowed(actor: Actor): Promise<ChatUser[]> {
    if (actor.role === 'client') {
      return unique(await this.messages.barbersOfClient(actor.id));
    }
    if (actor.role === 'barber') {
      const barberId = await this.messages.barberIdForUser(actor.id);
      if (!barberId) return [];
      const [clients, staff] = await Promise.all([
        this.messages.clientsOfBarber(barberId),
        this.messages.usersByRole(['admin', 'superadmin']),
      ]);
      return unique([...clients, ...staff]);
    }
    if (actor.role === 'admin' || actor.role === 'superadmin') {
      return this.messages.usersByRole(['barber']);
    }
    return [];
  }

  private async requireAllowed(actor: Actor, otherId: string) {
    if (otherId === actor.id) throw new DomainError('FORBIDDEN', 'No puedes escribirte a ti mismo.');
    const other = await this.messages.findUser(otherId);
    if (!other) throw new DomainError('NOT_FOUND', 'No encontramos a esa persona.');
    const people = await this.allowed(actor);
    if (!people.some((person) => person.id === other.id)) {
      throw new DomainError('FORBIDDEN', 'Esa conversación no está disponible para ti.');
    }
    return other;
  }
}

function unique(people: ChatUser[]) {
  const seen = new Set<string>();
  return people.filter((person) => {
    if (seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  });
}
