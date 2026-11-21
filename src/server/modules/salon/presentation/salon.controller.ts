import { z } from 'zod';
import type { Actor } from '@/server/shared/auth/actor';
import { SalonService } from '@/server/modules/salon/application/salon.service';

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'La fecha no es válida.');

const settingsSchema = z.object({
  durationMinutes: z.number().int().min(15).max(120),
  depositAmount: z.number().nonnegative(),
  commissionPercent: z.number().int().min(0).max(100),
  lowStockThreshold: z.number().int().min(0).max(100),
});

export class SalonController {
  constructor(private readonly salon: SalonService) {}

  settings(actor: Actor) {
    return this.salon.settings(actor);
  }

  updateSettings(actor: Actor, input: unknown) {
    return this.salon.updateSettings(actor, settingsSchema.parse(input));
  }

  holidays(actor: Actor) {
    return this.salon.holidays(actor);
  }

  addHoliday(actor: Actor, input: unknown) {
    const data = z.object({ date: dateSchema, reason: z.string().trim().min(2).max(80) }).parse(input);
    return this.salon.addHoliday(actor, data.date, data.reason);
  }

  removeHoliday(actor: Actor, date: string) {
    return this.salon.removeHoliday(actor, dateSchema.parse(date));
  }

  addDayOff(actor: Actor, input: unknown) {
    const data = z.object({ date: dateSchema, reason: z.string().trim().min(2).max(80) }).parse(input);
    return this.salon.addDayOff(actor, data.date, data.reason);
  }

  joinWaitlist(actor: Actor, input: unknown) {
    const data = z.object({ barberId: z.string().min(1), serviceId: z.string().min(1), date: dateSchema }).parse(input);
    return this.salon.joinWaitlist(actor, data);
  }

  reminders(actor: Actor, date: string | null) {
    return this.salon.reminders(actor, dateSchema.parse(date));
  }

  cashCut(actor: Actor, from: string | null, to: string | null) {
    return this.salon.cashCut(actor, dateSchema.parse(from), dateSchema.parse(to));
  }

  clientCard(actor: Actor, userId: string) {
    return this.salon.clientCard(actor, userId);
  }

  block(actor: Actor, userId: string, input: unknown) {
    const reason = z.object({ reason: z.string().trim().min(2).max(120) }).parse(input).reason;
    return this.salon.block(actor, userId, reason);
  }

  unblock(actor: Actor, userId: string) {
    return this.salon.unblock(actor, userId);
  }

  audit(actor: Actor) {
    return this.salon.audit(actor);
  }

  alerts(actor: Actor) {
    return this.salon.alerts(actor);
  }

  seeAlert(actor: Actor, id: string) {
    return this.salon.seeAlert(actor, id);
  }
}
