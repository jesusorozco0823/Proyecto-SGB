import { prisma } from '@/server/shared/database/prisma';
import { passwordHasher } from '@/server/shared/auth/password-hasher';
import { PrismaBarberRepository } from '@/server/modules/barbers/infrastructure/barber.repository';
import { PrismaAgendaRepository } from '@/server/modules/barbers/infrastructure/agenda.repository';
import { BarberService } from '@/server/modules/barbers/application/barber.service';
import { AgendaService } from '@/server/modules/barbers/application/agenda.service';
import { BarberController } from '@/server/modules/barbers/presentation/barber.controller';
import { AgendaController } from '@/server/modules/barbers/presentation/agenda.controller';

const barbers = new PrismaBarberRepository(prisma);
const service = new BarberService(barbers, passwordHasher);
const agenda = new AgendaService(new PrismaAgendaRepository(prisma), barbers);

export const barberController = new BarberController(service);
export const agendaController = new AgendaController(agenda);
