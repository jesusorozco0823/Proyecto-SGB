import { prisma } from '@/server/shared/database/prisma';
import { passwordHasher } from '@/server/shared/auth/password-hasher';
import { PrismaAdminRepository } from '@/server/modules/admins/infrastructure/admin.repository';
import { AdminService } from '@/server/modules/admins/application/admin.service';
import { AdminController } from '@/server/modules/admins/presentation/admin.controller';

const service = new AdminService(new PrismaAdminRepository(prisma), passwordHasher);
export const adminController = new AdminController(service);
