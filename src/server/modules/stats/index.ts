import { prisma } from '@/server/shared/database/prisma';
import { PrismaStatsRepository } from '@/server/modules/stats/infrastructure/stats.repository';
import { StatsService } from '@/server/modules/stats/application/stats.service';
import { StatsController } from '@/server/modules/stats/presentation/stats.controller';

export const statsController = new StatsController(new StatsService(new PrismaStatsRepository(prisma)));
