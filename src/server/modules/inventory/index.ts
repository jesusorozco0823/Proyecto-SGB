import { prisma } from '@/server/shared/database/prisma';
import { PrismaInventoryRepository } from '@/server/modules/inventory/infrastructure/inventory.repository';
import { InventoryService } from '@/server/modules/inventory/application/inventory.service';
import { InventoryController } from '@/server/modules/inventory/presentation/inventory.controller';

export const inventoryController = new InventoryController(new InventoryService(new PrismaInventoryRepository(prisma)));
