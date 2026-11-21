export const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export type DayWindow = { start: string; end: string } | null;

export type WeekSchedule = Record<DayKey, DayWindow>;

const TIME_PATTERN = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

export function parseDisplayTime(value: string): number {
  const match = value.trim().match(TIME_PATTERN);
  if (!match) {
    throw new Error(`Hora inválida: ${value}`);
  }

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    throw new Error(`Hora inválida: ${value}`);
  }

  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
}

export function formatDisplayTime(totalMinutes: number): string {
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
}

export function emptyWeek(): WeekSchedule {
  return {
    sunday: null,
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
  };
}
