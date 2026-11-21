import { DomainError } from '@/server/shared/errors/domain-error';
import { formatDisplayTime } from '@/server/shared/time/schedule-time';

export const LUNCH_EARLIEST = 11 * 60;
export const LUNCH_LATEST_END = 14 * 60;

export type PlannerService = {
  id: string;
  name: string;
  durationMinutes: number;
  isSpecial: boolean;
};

export type PlannedTurn = {
  startMin: number;
  endMin: number;
  durationMinutes: number;
  serviceId: string | null;
  isExtra: boolean;
  placedByBarber: boolean;
};

export type Block = { startMin: number; endMin: number };

export type DurationGroup = {
  durationMinutes: number;
  kind: 'pool' | 'dedicated';
  services: PlannerService[];
  count: number | null;
  maxCount: number;
};

export type ExtraTurnPlan = {
  remainderMinutes: number;
  extensionMinutes: number;
  startMin: number;
  endMin: number;
  effectiveCloseMin: number;
  serviceId: string;
  serviceName: string;
};

export type AgendaPreview = {
  morning: Block;
  afternoon: Block;
  workMinutes: number;
  groups: DurationGroup[];
  suggestions: string[];
  needsCounts: boolean;
  needsSpecialTime: boolean;
  turns: PlannedTurn[];
  remainderMinutes: number;
  extra: ExtraTurnPlan | null;
};

type Interval = { start: number; end: number };

export function assertLunchFits(input: {
  openMin: number;
  closeMin: number;
  lunchStartMin: number;
  lunchDuration: number;
}): { morning: Block; afternoon: Block } {
  if (input.closeMin <= input.openMin) {
    throw new DomainError('INVALID_SCHEDULE', 'La hora de cierre debe ser posterior a la de apertura.');
  }
  const lunchEnd = input.lunchStartMin + input.lunchDuration;
  if (input.lunchStartMin < LUNCH_EARLIEST || lunchEnd > LUNCH_LATEST_END) {
    throw new DomainError('INVALID_SCHEDULE', 'El almuerzo debe estar entre las 11:00 a. m. y las 2:00 p. m.');
  }
  if (input.lunchStartMin < input.openMin || lunchEnd > input.closeMin) {
    throw new DomainError('INVALID_SCHEDULE', 'El almuerzo debe caer dentro de la jornada.');
  }
  return {
    morning: { startMin: input.openMin, endMin: input.lunchStartMin },
    afternoon: { startMin: lunchEnd, endMin: input.closeMin },
  };
}

export function planExtraTurn(closeMin: number, remainderMinutes: number, service: PlannerService): ExtraTurnPlan {
  if (remainderMinutes <= 0) {
    throw new DomainError('INVALID_STATE', 'No hay minutos libres al cierre.');
  }
  const startMin = closeMin - remainderMinutes;
  const endMin = startMin + service.durationMinutes;
  const extensionMinutes = Math.max(0, endMin - closeMin);
  return {
    remainderMinutes,
    extensionMinutes,
    startMin,
    endMin,
    effectiveCloseMin: endMin,
    serviceId: service.id,
    serviceName: service.name,
  };
}

export function previewAgenda(input: {
  openMin: number;
  closeMin: number;
  lunchStartMin: number;
  lunchDuration: number;
  services: PlannerService[];
  counts: { serviceId: string; count: number }[];
  specialStartMin?: number | null;
  specialStarts?: { serviceId: string; startMin: number }[];
  extraServiceId?: string | null;
}): AgendaPreview {
  const blocks = assertLunchFits(input);
  if (input.services.length === 0) {
    throw new DomainError('VALIDATION', 'Elige al menos un servicio para el día.');
  }
  for (const service of input.services) {
    if (service.durationMinutes <= 0) {
      throw new DomainError('VALIDATION', `La duración de ${service.name} debe ser mayor a cero.`);
    }
  }

  const workMinutes = blockLength(blocks.morning) + blockLength(blocks.afternoon);
  const grouped = groupServices(input.services);
  const distinctDurations = grouped.length;
  const needsCounts = distinctDurations > 1;
  const countOf = new Map(input.counts.map((item) => [item.serviceId, item.count]));

  const dedicated = grouped.filter((group) => group.services.length === 1);
  const missingDedicated = needsCounts && dedicated.some((group) => !countOf.has(group.services[0].id));
  const specials = input.services.filter((service) => service.isSpecial && grouped.find((group) => group.durationMinutes === service.durationMinutes)!.services.length === 1);
  const activeSpecials = specials.filter((service) => (needsCounts ? (countOf.get(service.id) ?? 0) > 0 : true));
  const firstSpecial = activeSpecials[0];
  const firstHasTime = Boolean(firstSpecial && (input.specialStarts?.some((item) => item.serviceId === firstSpecial.id) || input.specialStartMin != null));
  const needsSpecialTime = activeSpecials.length > 0 && !firstHasTime;

  const groups = buildGroups(grouped, countOf, workMinutes, needsCounts);
  const suggestions = buildSuggestions(groups);

  if (missingDedicated || needsSpecialTime) {
    return {
      ...blocks,
      workMinutes,
      groups,
      suggestions,
      needsCounts,
      needsSpecialTime,
      turns: [],
      remainderMinutes: 0,
      extra: null,
    };
  }

  const turns = placeTurns({
    blocks,
    services: input.services,
    groups: grouped,
    counts: countOf,
    needsCounts,
    specialStartMin: input.specialStartMin ?? null,
    specialStarts: input.specialStarts ?? [],
  });
  const remainderMinutes = trailingGap(blocks.afternoon, turns);
  const extraService = input.extraServiceId ? input.services.find((service) => service.id === input.extraServiceId) : undefined;
  const extra = remainderMinutes > 0 && extraService ? planExtraTurn(input.closeMin, remainderMinutes, extraService) : null;
  if (extra) {
    turns.push({
      startMin: extra.startMin,
      endMin: extra.endMin,
      durationMinutes: extraService!.durationMinutes,
      serviceId: extra.serviceId,
      isExtra: true,
      placedByBarber: false,
    });
  }

  return {
    ...blocks,
    workMinutes,
    groups,
    suggestions,
    needsCounts,
    needsSpecialTime: false,
    turns,
    remainderMinutes,
    extra,
  };
}

function blockLength(block: Block) {
  return block.endMin - block.startMin;
}

function groupServices(services: PlannerService[]) {
  const map = new Map<number, PlannerService[]>();
  for (const service of services) {
    const list = map.get(service.durationMinutes) ?? [];
    list.push(service);
    map.set(service.durationMinutes, list);
  }
  return [...map.entries()].map(([durationMinutes, grouped]) => ({ durationMinutes, services: grouped }));
}

function buildGroups(
  grouped: { durationMinutes: number; services: PlannerService[] }[],
  counts: Map<string, number>,
  workMinutes: number,
  needsCounts: boolean,
): DurationGroup[] {
  const dedicatedMinutes = grouped
    .filter((group) => group.services.length === 1)
    .reduce((sum, group) => sum + (counts.get(group.services[0].id) ?? 0) * group.durationMinutes, 0);

  return grouped.map((group) => {
    const kind = group.services.length > 1 ? 'pool' as const : 'dedicated' as const;
    const usedByOthers = grouped
      .filter((other) => other !== group && other.services.length === 1)
      .reduce((sum, other) => sum + (counts.get(other.services[0].id) ?? 0) * other.durationMinutes, 0);
    const maxCount = Math.floor(Math.max(0, workMinutes - usedByOthers) / group.durationMinutes);
    const count = kind === 'pool' || !needsCounts
      ? maxCount
      : counts.has(group.services[0].id) ? counts.get(group.services[0].id)! : null;
    return { durationMinutes: group.durationMinutes, kind, services: group.services, count, maxCount };
  }).map((group) => {
    if (group.kind === 'pool') {
      const poolMax = Math.floor(Math.max(0, workMinutes - dedicatedMinutes) / group.durationMinutes);
      return { ...group, count: poolMax, maxCount: poolMax };
    }
    return group;
  });
}

function buildSuggestions(groups: DurationGroup[]) {
  return groups.map((group) => {
    const names = group.services.map((service) => service.name).join(', ');
    if (group.kind === 'pool') {
      return `Los servicios de ${group.durationMinutes} min (${names}) comparten turno. Caben ${group.maxCount}. El cliente elige cuál quiere.`;
    }
    return `Si reservas turnos de ${names}, caben hasta ${group.maxCount}.`;
  });
}

function placeTurns(input: {
  blocks: { morning: Block; afternoon: Block };
  services: PlannerService[];
  groups: { durationMinutes: number; services: PlannerService[] }[];
  counts: Map<string, number>;
  needsCounts: boolean;
  specialStartMin: number | null;
  specialStarts: { serviceId: string; startMin: number }[];
}): PlannedTurn[] {
  const blocks = [input.blocks.morning, input.blocks.afternoon];
  let free = blocks.map((block) => ({ start: block.startMin, end: block.endMin }));
  const turns: PlannedTurn[] = [];

  const dedicated = input.groups.filter((group) => group.services.length === 1).map((group) => group.services[0]);
  const specials = input.services.filter((service) => service.isSpecial && dedicated.some((item) => item.id === service.id));
  const regular = dedicated.filter((service) => !service.isSpecial).sort((a, b) => b.durationMinutes - a.durationMinutes);

  const laid = laySpecials(
    free,
    specials.map((service) => ({
      service,
      count: input.needsCounts ? input.counts.get(service.id) ?? 0 : null,
    })),
    input.specialStartMin,
    input.specialStarts,
  );
  free = laid.free;
  turns.push(...laid.turns);

  for (const service of regular) {
    const count = input.needsCounts ? input.counts.get(service.id) ?? 0 : fillCount(free, service.durationMinutes);
    placeMany(free, turns, service, count, false);
    free = currentFree(blocks, turns);
  }

  const pools = input.groups.filter((group) => group.services.length > 1);
  for (const pool of pools) {
    const count = fillCount(free, pool.durationMinutes);
    for (let index = 0; index < count; index += 1) {
      const slot = takeSlot(free, pool.durationMinutes);
      if (!slot) break;
      free = slot.free;
      turns.push(turnFrom(slot.start, pool.durationMinutes, null, false));
    }
  }

  return turns.sort((a, b) => a.startMin - b.startMin);
}

function laySpecials(
  free: Interval[],
  jobs: { service: PlannerService; count: number | null }[],
  firstStartMin: number | null,
  overrides: { serviceId: string; startMin: number }[],
) {
  let available = free.map((interval) => ({ ...interval }));
  const turns: PlannedTurn[] = [];
  let chainEnd: number | null = null;
  let usedFallback = false;

  for (const job of jobs) {
    const override = overrides.find((item) => item.serviceId === job.service.id)?.startMin ?? null;
    let explicit = override;
    if (explicit == null && !usedFallback && firstStartMin != null) {
      explicit = firstStartMin;
      usedFallback = true;
    }
    const desired: number | null = explicit ?? chainEnd;
    if (job.count === 0) continue;
    if (desired == null) {
      throw new DomainError('VALIDATION', 'Indica la hora del servicio especial.');
    }
    const count = job.count ?? countFrom(available, desired, job.service.durationMinutes);
    for (let index = 0; index < count; index += 1) {
      const start: number | null = index === 0 ? desired : chainEnd;
      if (start == null) {
        throw new DomainError('VALIDATION', 'Indica la hora del servicio especial.');
      }
      const exact = index === 0 && explicit != null;
      let placed: { free: Interval[]; start: number } | null = null;
      if (exact) {
        const fixed = placeFixed(available, start, job.service.durationMinutes);
        placed = fixed ? { free: fixed.free, start } : null;
      } else {
        placed = placeAtOrAfter(available, start, job.service.durationMinutes);
      }
      if (!placed) {
        throw new DomainError('INVALID_SCHEDULE', 'El servicio especial no cabe en ese horario.');
      }
      available = placed.free;
      turns.push(turnFrom(placed.start, job.service.durationMinutes, job.service.id, index === 0 && explicit != null));
      chainEnd = placed.start + job.service.durationMinutes;
    }
  }

  return { free: available, turns };
}

export function chainSpecialStarts(input: {
  openMin: number;
  closeMin: number;
  lunchStartMin: number;
  lunchDuration: number;
  specials: { id: string; name: string; durationMinutes: number; count: number | null }[];
  firstStartMin: number | null;
  overrides?: { serviceId: string; startMin: number }[];
}) {
  const blocks = assertLunchFits(input);
  const free = [blocks.morning, blocks.afternoon].map((block) => ({ start: block.startMin, end: block.endMin }));
  return laySpecials(
    free,
    input.specials.map((service) => ({
      service: { id: service.id, name: service.name, durationMinutes: service.durationMinutes, isSpecial: true },
      count: service.count,
    })),
    input.firstStartMin,
    input.overrides ?? [],
  ).turns.map((turn) => ({
    serviceId: turn.serviceId ?? '',
    startMin: turn.startMin,
    placedByBarber: turn.placedByBarber,
  }));
}

function placeMany(free: Interval[], turns: PlannedTurn[], service: PlannerService, count: number, placedByBarber: boolean) {
  let available = free;
  for (let index = 0; index < count; index += 1) {
    const slot = takeSlot(available, service.durationMinutes);
    if (!slot) {
      throw new DomainError('INVALID_SCHEDULE', `No caben ${count} turnos de ${service.name}.`);
    }
    available = slot.free;
    turns.push(turnFrom(slot.start, service.durationMinutes, service.id, placedByBarber));
  }
  free.splice(0, free.length, ...available);
}

function fillCount(free: Interval[], duration: number) {
  let available = free.map((interval) => ({ ...interval }));
  let count = 0;
  while (true) {
    const slot = takeSlot(available, duration);
    if (!slot) return count;
    available = slot.free;
    count += 1;
  }
}

function placeAtOrAfter(free: Interval[], desired: number, duration: number): { free: Interval[]; start: number } | null {
  const exact = placeFixed(free, desired, duration);
  if (exact) return { free: exact.free, start: desired };
  for (const interval of free) {
    const start = Math.max(interval.start, desired);
    if (start + duration <= interval.end) {
      const placed = placeFixed(free, start, duration);
      if (placed) return { free: placed.free, start };
    }
  }
  return null;
}

function countFrom(free: Interval[], desired: number, duration: number): number {
  let available = free.map((interval) => ({ ...interval }));
  let cursor = desired;
  let count = 0;
  while (true) {
    const placed = placeAtOrAfter(available, cursor, duration);
    if (!placed) return count;
    available = placed.free;
    cursor = placed.start + duration;
    count += 1;
  }
}

function placeFixed(free: Interval[], start: number, duration: number): { free: Interval[] } | null {
  const end = start + duration;
  const index = free.findIndex((interval) => start >= interval.start && end <= interval.end);
  if (index < 0) return null;
  const interval = free[index];
  const next = free.filter((_, item) => item !== index);
  if (interval.start < start) next.push({ start: interval.start, end: start });
  if (end < interval.end) next.push({ start: end, end: interval.end });
  next.sort((a, b) => a.start - b.start);
  return { free: next };
}

function currentFree(blocks: Block[], turns: PlannedTurn[]) {
  return blocks.flatMap((block) => subtractOccupied({ start: block.startMin, end: block.endMin }, turns.map((turn) => ({ start: turn.startMin, end: turn.endMin }))));
}

function subtractOccupied(block: Interval, occupied: Interval[]) {
  let free = [block];
  for (const item of occupied) {
    free = free.flatMap((gap) => {
      if (item.end <= gap.start || item.start >= gap.end) return [gap];
      const parts: Interval[] = [];
      if (item.start > gap.start) parts.push({ start: gap.start, end: item.start });
      if (item.end < gap.end) parts.push({ start: item.end, end: gap.end });
      return parts;
    });
  }
  return free.filter((gap) => gap.end > gap.start);
}

function takeSlot(free: Interval[], duration: number) {
  const index = free.findIndex((interval) => interval.end - interval.start >= duration);
  if (index < 0) return null;
  const interval = free[index];
  const start = interval.start;
  const next = [...free];
  next.splice(index, 1);
  if (start + duration < interval.end) {
    next.splice(index, 0, { start: start + duration, end: interval.end });
  }
  return { start, free: next };
}

function turnFrom(startMin: number, duration: number, serviceId: string | null, placedByBarber: boolean): PlannedTurn {
  return {
    startMin,
    endMin: startMin + duration,
    durationMinutes: duration,
    serviceId,
    isExtra: false,
    placedByBarber,
  };
}

function trailingGap(afternoon: Block, turns: PlannedTurn[]) {
  const inside = turns.filter((turn) => turn.endMin <= afternoon.endMin && turn.startMin >= afternoon.startMin);
  const lastEnd = inside.reduce((end, turn) => Math.max(end, turn.endMin), afternoon.startMin);
  return Math.max(0, afternoon.endMin - lastEnd);
}

export function formatAgendaTime(minutes: number) {
  return formatDisplayTime(minutes);
}
