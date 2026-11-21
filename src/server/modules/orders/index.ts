import { prisma } from '@/server/shared/database/prisma';
import { PrismaOrderRepository } from '@/server/modules/orders/infrastructure/order.repository';
import { OrderService } from '@/server/modules/orders/application/order.service';
import { OrderController } from '@/server/modules/orders/presentation/order.controller';

export const orderController = new OrderController(new OrderService(new PrismaOrderRepository(prisma)));
