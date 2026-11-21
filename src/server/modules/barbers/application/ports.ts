import type { Barber } from '@/lib/types';
import type { ScheduleRow } from '@/server/modules/barbers/domain/schedule';
import type { WeekSchedule } from '@/server/shared/time/schedule-time';

export type BarberDraft = {
  name: string;
  documentNumber: string;
  phone: string;
  passwordHash: string;
  skills: string[];
  imageUrl: string;
};

export type BarberPatch = {
  name: string;
  documentNumber: string;
  phone: string;
  skills: string[];
  imageUrl: string;
};

export interface BarberRepository {
  list(): Promise<Barber[]>;
  findById(id: string): Promise<Barber | null>;
  findByUserId(userId: string): Promise<Barber | null>;
  scheduleRows(barberId: string): Promise<ScheduleRow[]>;
  create(input: BarberDraft): Promise<Barber>;
  update(id: string, input: BarberPatch): Promise<Barber>;
  replaceSchedule(barberId: string, rows: ScheduleRow[]): Promise<WeekSchedule>;
  countScheduled(barberId: string): Promise<number>;
  delete(id: string): Promise<void>;
  busyOnDay(barberId: string, dayStart: Date, dayEnd: Date): Promise<{ startsAt: Date; endsAt: Date }[]>;
}
