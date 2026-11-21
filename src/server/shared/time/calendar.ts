export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function startOfWeekMonday(day: Date): Date {
  const start = startOfLocalDay(day);
  const weekday = start.getDay();
  const distance = weekday === 0 ? 6 : weekday - 1;
  return addDays(start, -distance);
}

export function parseLocalDate(value: string): Date {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error('Fecha inválida');
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}
