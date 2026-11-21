import { prisma } from '@/server/shared/database/prisma';
import { PrismaAppointmentRepository } from '@/server/modules/appointments/infrastructure/appointment.repository';
import { AppointmentService } from '@/server/modules/appointments/application/appointment.service';
import { AppointmentController } from '@/server/modules/appointments/presentation/appointment.controller';

const appointments = new PrismaAppointmentRepository(prisma);

export const appointmentController = new AppointmentController(new AppointmentService(appointments));

const reminderHost = globalThis as { sgbReminderTimer?: ReturnType<typeof setInterval> };
if (reminderHost.sgbReminderTimer) clearInterval(reminderHost.sgbReminderTimer);
const remind = () => {
  void appointments.sendDueReminders().catch(() => undefined);
};
remind();
reminderHost.sgbReminderTimer = setInterval(remind, 30_000);
