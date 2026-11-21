import { DomainError } from '@/server/shared/errors/domain-error';
import {
  DAY_KEYS,
  emptyWeek,
  formatDisplayTime,
  parseDisplayTime,
  type DayKey,
  type WeekSchedule,
} from '@/server/shared/time/schedule-time';

export type ScheduleRow = {
  dayOfWeek: number;
  startMin: number | null;
  endMin: number | null;
};

export function rowsToSchedule(rows: ScheduleRow[]): WeekSchedule {
  const schedule = emptyWeek();
  for (const row of rows) {
    const key = DAY_KEYS[row.dayOfWeek] as DayKey | undefined;
    if (!key) continue;
    if (row.startMin == null || row.endMin == null) {
      schedule[key] = null;
    } else {
      schedule[key] = {
        start: formatDisplayTime(row.startMin),
        end: formatDisplayTime(row.endMin),
      };
    }
  }
  return schedule;
}

export function scheduleToRows(schedule: WeekSchedule): ScheduleRow[] {
  return DAY_KEYS.map((key, dayOfWeek) => {
    const window = schedule[key];
    if (!window) {
      return { dayOfWeek, startMin: null, endMin: null };
    }

    let startMin: number;
    let endMin: number;
    try {
      startMin = parseDisplayTime(window.start);
      endMin = parseDisplayTime(window.end);
    } catch {
      throw new DomainError('INVALID_SCHEDULE', `La hora de ${key} no es válida.`);
    }

    if (endMin <= startMin) {
      throw new DomainError('INVALID_SCHEDULE', `El horario de ${key} termina antes de empezar.`);
    }

    return { dayOfWeek, startMin, endMin };
  });
}

export function closedWeekRows(): ScheduleRow[] {
  return DAY_KEYS.map((_, dayOfWeek) => ({ dayOfWeek, startMin: null, endMin: null }));
}

export type BusyRange = { startsAt: Date; endsAt: Date };

export function buildSlots(input: {
  day: Date;
  startMin: number;
  endMin: number;
  duration: number;
  busy: BusyRange[];
  now: Date;
}): { label: string; startsAt: string }[] {
  const slots: { label: string; startsAt: string }[] = [];
  const step = 30;

  for (let minute = input.startMin; minute + input.duration <= input.endMin; minute += step) {
    const startsAt = new Date(input.day.getTime() + minute * 60_000);
    const endsAt = new Date(startsAt.getTime() + input.duration * 60_000);
    if (startsAt.getTime() <= input.now.getTime()) continue;

    const overlaps = input.busy.some((range) => startsAt < range.endsAt && endsAt > range.startsAt);
    if (overlaps) continue;

    slots.push({ label: formatDisplayTime(minute), startsAt: startsAt.toISOString() });
  }

  return slots;
}

export function assertInsideShift(rows: ScheduleRow[], startsAt: Date, endsAt: Date) {
  const row = rows.find((item) => item.dayOfWeek === startsAt.getDay());
  if (!row || row.startMin == null || row.endMin == null) {
    throw new DomainError('INVALID_STATE', 'El barbero no trabaja ese día.');
  }

  const startMin = startsAt.getHours() * 60 + startsAt.getMinutes();
  const duration = (endsAt.getTime() - startsAt.getTime()) / 60_000;
  if (startMin < row.startMin || startMin + duration > row.endMin) {
    throw new DomainError('INVALID_STATE', 'El horario elegido queda fuera de la jornada del barbero.');
  }
}
