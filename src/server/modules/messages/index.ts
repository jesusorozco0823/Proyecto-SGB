import { prisma } from '@/server/shared/database/prisma';
import { PrismaMessageRepository } from '@/server/modules/messages/infrastructure/message.repository';
import { MessageService } from '@/server/modules/messages/application/message.service';
import { MessageController } from '@/server/modules/messages/presentation/message.controller';

export const messageController = new MessageController(
  new MessageService(new PrismaMessageRepository(prisma)),
);
