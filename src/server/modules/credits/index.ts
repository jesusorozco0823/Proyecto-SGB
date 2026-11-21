import { prisma } from '@/server/shared/database/prisma';
import { PrismaCreditRepository } from '@/server/modules/credits/infrastructure/credit.repository';
import { CreditService } from '@/server/modules/credits/application/credit.service';
import { CreditController } from '@/server/modules/credits/presentation/credit.controller';

export const creditController = new CreditController(
  new CreditService(new PrismaCreditRepository(prisma)),
);
