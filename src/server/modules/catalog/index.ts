import { prisma } from '@/server/shared/database/prisma';
import { PrismaCatalogRepository } from '@/server/modules/catalog/infrastructure/catalog.repository';
import { CatalogService } from '@/server/modules/catalog/application/catalog.service';
import { CatalogController } from '@/server/modules/catalog/presentation/catalog.controller';

export const catalogController = new CatalogController(new CatalogService(new PrismaCatalogRepository(prisma)));
