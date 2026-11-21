export type ChatUser = {
  id: string;
  displayName: string;
  role: 'client' | 'admin' | 'barber' | 'superadmin';
};

export type ChatMessage = {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  createdAt: string;
  readAt: string | null;
};

export interface MessageRepository {
  purgeExpired(cutoff: Date): Promise<void>;
  findUser(id: string): Promise<ChatUser | null>;
  barberIdForUser(userId: string): Promise<string | null>;
  clientsOfBarber(barberId: string): Promise<ChatUser[]>;
  barbersOfClient(clientId: string): Promise<ChatUser[]>;
  usersByRole(roles: ChatUser['role'][]): Promise<ChatUser[]>;
  create(input: { senderId: string; recipientId: string; body: string }): Promise<ChatMessage>;
  thread(userId: string, otherId: string, cutoff: Date): Promise<ChatMessage[]>;
  markRead(recipientId: string, senderId: string): Promise<number>;
  unread(recipientId: string, cutoff: Date): Promise<Array<ChatMessage & { senderName: string }>>;
  activity(userId: string, cutoff: Date): Promise<Map<string, { incoming: number; outgoingUnread: number }>>;
}
