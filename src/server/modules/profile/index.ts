import { prisma } from '@/server/shared/database/prisma';
import { PrismaProfileRepository } from '@/server/modules/profile/infrastructure/profile.repository';
import { ProfileService } from '@/server/modules/profile/application/profile.service';
import { ProfileController } from '@/server/modules/profile/presentation/profile.controller';

const service = new ProfileService(new PrismaProfileRepository(prisma));
export const profileController = new ProfileController(service);
