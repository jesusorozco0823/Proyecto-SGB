import { prisma } from '@/server/shared/database/prisma';
import { PrismaBarberRepository } from '@/server/modules/barbers/infrastructure/barber.repository';
import { SalonService } from '@/server/modules/salon/application/salon.service';
import { SalonController } from '@/server/modules/salon/presentation/salon.controller';

export const salonController = new SalonController(new SalonService(prisma, new PrismaBarberRepository(prisma)));
