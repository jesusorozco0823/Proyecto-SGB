import type { Actor } from '@/server/shared/auth/actor';
import { assertRole } from '@/server/shared/auth/authorize';
import { DomainError } from '@/server/shared/errors/domain-error';
import { formatDisplayTime, parseDisplayTime } from '@/server/shared/time/schedule-time';
import { previewAgenda } from '@/server/modules/barbers/domain/turn-planner';
import type { BarberRepository } from '@/server/modules/barbers/application/ports';
import type { AgendaRepository, AgendaResult, OfferingDraft } from '@/server/modules/barbers/application/agenda.ports';

export type AgendaRequest = {
  open: string;
  close: string;
  lunchStart: string;
  serviceIds: string[];
  counts: { serviceId: string; count: number }[];
  specialStart?: string;
  specialStarts?: { serviceId: string; start: string }[];
  extraServiceId?: string;
};

const WEEK = [1, 2, 3, 4, 5, 6];

export class AgendaService {
  constructor(
    private readonly agenda: AgendaRepository,
    private readonly barbers: BarberRepository,
  ) {}

  async lunch(actor: Actor) {
    assertRole(actor, ['admin', 'barber', 'superadmin']);
    return { durationMinutes: await this.agenda.lunchDuration() };
  }

  async updateLunch(actor: Actor, durationMinutes: number) {
    assertRole(actor, ['admin']);
    if (durationMinutes < 15 || durationMinutes > 120) {
      throw new DomainError('VALIDATION', 'La duración del almuerzo debe estar entre 15 y 120 minutos.');
    }
    return { durationMinutes: await this.agenda.setLunchDuration(durationMinutes) };
  }

  async listOwnOfferings(actor: Actor) {
    const barber = await this.requireBarber(actor);
    return this.agenda.listOfferings(barber.id);
  }

  async listOfferings(actor: Actor, barberId: string) {
    assertRole(actor, ['admin', 'client', 'barber']);
    if (actor.role === 'barber') {
      const own = await this.barbers.findByUserId(actor.id);
      if (!own || own.id !== barberId) throw new DomainError('FORBIDDEN', 'Solo puedes ver tus servicios.');
    }
    const barber = await this.barbers.findById(barberId);
    if (!barber) throw new DomainError('NOT_FOUND', 'No encontramos ese barbero.');
    return this.agenda.listOfferings(barberId);
  }

  async createOffering(actor: Actor, input: OfferingDraft) {
    const barber = await this.requireBarber(actor);
    if (input.durationMinutes <= 0) {
      throw new DomainError('VALIDATION', 'La duración debe ser mayor a cero.');
    }
    return this.agenda.createOffering(barber.id, input);
  }

  async updateOffering(actor: Actor, id: string, input: Partial<OfferingDraft> & { active?: boolean }) {
    const barber = await this.requireBarber(actor);
    const updated = await this.agenda.updateOffering(barber.id, id, input);
    if (!updated) throw new DomainError('NOT_FOUND', 'No encontramos ese servicio.');
    return updated;
  }

  async preview(actor: Actor, input: AgendaRequest) {
    const barber = await this.requireBarber(actor);
    return this.build(barber.id, input);
  }

  async save(actor: Actor, input: AgendaRequest & { weekdays: number[] }) {
    const barber = await this.requireBarber(actor);
    const weekdays = input.weekdays.length > 0 ? [...new Set(input.weekdays)] : WEEK;
    if (weekdays.some((day) => day < 0 || day > 6)) {
      throw new DomainError('VALIDATION', 'El día de la semana no es válido.');
    }
    if (await this.weekIsLoaded(barber.id)) {
      throw new DomainError('VALIDATION', 'La semana ya está cargada. Agrega o quita turnos en el día que necesites.');
    }
    const preview = await this.build(barber.id, input);
    if (preview.needsCounts && preview.turns.length === 0) {
      throw new DomainError('VALIDATION', 'Indica cuántos turnos quieres de cada duración.');
    }
    if (preview.needsSpecialTime) {
      throw new DomainError('VALIDATION', 'Indica la hora del servicio especial.');
    }
    if (preview.remainderMinutes > 0 && !preview.extra) {
      throw new DomainError('VALIDATION', `Quedan ${preview.remainderMinutes} minutos al cierre. Elige el servicio del turno extra.`);
    }
    if (preview.turns.length === 0) {
      throw new DomainError('VALIDATION', 'La jornada no tiene turnos para guardar.');
    }

    const openMin = parseDisplayTime(input.open);
    const closeMin = parseDisplayTime(input.close);
    const lunchStartMin = parseDisplayTime(input.lunchStart);
    await this.agenda.savePlans(barber.id, weekdays.map((dayOfWeek) => ({
      dayOfWeek,
      openMin,
      closeMin,
      lunchStartMin,
      effectiveCloseMin: preview.effectiveCloseMin,
      turns: preview.turns,
    })));
    return {
      weekdays,
      effectiveClose: formatDisplayTime(preview.effectiveCloseMin),
      turns: preview.turns.length,
    };
  }

  async turns(actor: Actor, barberId: string, date: string, serviceId: string) {
    assertRole(actor, ['admin', 'client', 'barber']);
    if (actor.role === 'barber') {
      const own = await this.barbers.findByUserId(actor.id);
      if (!own || own.id !== barberId) throw new DomainError('FORBIDDEN', 'Solo puedes ver tu agenda.');
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new DomainError('VALIDATION', 'La fecha no es válida.');
    }
    const match = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const day = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
    const depositAmount = await this.agenda.depositAmount();
    if (day && await this.agenda.isClosed(barberId, day)) {
      return { turns: [], closed: true, depositAmount };
    }
    const offerings = await this.agenda.listOfferings(barberId);
    const offering = offerings.find((item) => item.id === serviceId);
    if (!offering) throw new DomainError('NOT_FOUND', 'Ese servicio no está disponible.');
    const turns = await this.agenda.openTurns(barberId, date);
    return {
      closed: false,
      depositAmount,
      turns: turns
        .filter((turn) => turn.serviceId === offering.id || (turn.serviceId === null && turn.durationMinutes === offering.durationMinutes))
        .map((turn) => ({
          id: turn.id,
          start: formatDisplayTime(turn.startMin),
          end: formatDisplayTime(turn.endMin),
          durationMinutes: turn.durationMinutes,
          isExtra: turn.isExtra,
        })),
    };
  }

  private async build(barberId: string, input: AgendaRequest): Promise<AgendaResult> {
    const offerings = await this.agenda.listOfferings(barberId);
    const selected = offerings.filter((item) => input.serviceIds.includes(item.id));
    if (selected.length !== new Set(input.serviceIds).size) {
      throw new DomainError('VALIDATION', 'Hay servicios que ya no están en tu catálogo.');
    }
    let openMin: number;
    let closeMin: number;
    let lunchStartMin: number;
    try {
      openMin = parseDisplayTime(input.open);
      closeMin = parseDisplayTime(input.close);
      lunchStartMin = parseDisplayTime(input.lunchStart);
    } catch {
      throw new DomainError('VALIDATION', 'Usa horas como 09:00 AM.');
    }
    const specialStartMin = input.specialStart ? parseDisplayTime(input.specialStart) : null;
    let specialStarts: { serviceId: string; startMin: number }[] = [];
    try {
      specialStarts = (input.specialStarts ?? []).map((item) => ({
        serviceId: item.serviceId,
        startMin: parseDisplayTime(item.start),
      }));
    } catch {
      throw new DomainError('VALIDATION', 'Usa horas como 09:00 AM.');
    }
    const preview = previewAgenda({
      openMin,
      closeMin,
      lunchStartMin,
      lunchDuration: await this.agenda.lunchDuration(),
      services: selected.map((item) => ({
        id: item.id,
        name: item.name,
        durationMinutes: item.durationMinutes,
        isSpecial: item.isSpecial,
      })),
      counts: input.counts,
      specialStartMin,
      specialStarts,
      extraServiceId: input.extraServiceId,
    });
    return { ...preview, effectiveCloseMin: preview.extra?.effectiveCloseMin ?? closeMin };
  }

  async openDays(actor: Actor) {
    const barber = await this.requireBarber(actor);
    const offerings = await this.agenda.listOfferings(barber.id);
    const names = new Map(offerings.map((item) => [item.id, item.name]));
    const lunch = await this.agenda.lunchDuration();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = [];
    for (let offset = 0; offset < 14; offset += 1) {
      const local = new Date(today);
      local.setDate(today.getDate() + offset);
      const date = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, '0')}-${String(local.getDate()).padStart(2, '0')}`;
      const utc = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
      const plan = await this.agenda.planFor(barber.id, utc.getUTCDay());
      if (!plan) continue;
      const closed = await this.agenda.isClosed(barber.id, utc);
      const turns = closed ? [] : await this.agenda.openTurns(barber.id, date);
      const taken = closed ? [] : await this.agenda.turnsOn(barber.id, utc);
      days.push({
        date,
        label: new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(local),
        closed,
        open: formatDisplayTime(plan.openMin),
        close: formatDisplayTime(plan.closeMin),
        lunchStart: formatDisplayTime(plan.lunchStartMin),
        lunchEnd: formatDisplayTime(plan.lunchStartMin + lunch),
        occupied: taken
          .filter((turn) => turn.status === 'open' || turn.status === 'booked')
          .map((turn) => ({ start: formatDisplayTime(turn.startMin), end: formatDisplayTime(turn.endMin) })),
        turns: turns.map((turn) => ({
          id: turn.id,
          start: formatDisplayTime(turn.startMin),
          end: formatDisplayTime(turn.endMin),
          name: turn.serviceId ? names.get(turn.serviceId) ?? 'Servicio' : 'El cliente elige',
          isExtra: turn.isExtra,
        })),
      });
    }
    return {
      weekLoaded: await this.weekIsLoaded(barber.id),
      services: offerings.map((item) => ({ id: item.id, name: item.name, durationMinutes: item.durationMinutes })),
      days,
    };
  }

  async addTurn(actor: Actor, input: { date: string; start: string; serviceId: string }) {
    const barber = await this.requireBarber(actor);
    const utc = calendarUtc(input.date);
    if (!utc) throw new DomainError('VALIDATION', 'La fecha no es válida.');
    const today = new Date();
    const todayUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    if (utc < todayUtc) throw new DomainError('VALIDATION', 'Ese día ya pasó.');
    if (await this.agenda.isClosed(barber.id, utc)) throw new DomainError('VALIDATION', 'Ese día está cerrado.');
    const plan = await this.agenda.planFor(barber.id, utc.getUTCDay());
    if (!plan) throw new DomainError('VALIDATION', 'Ese día no tiene horario cargado.');
    const offerings = await this.agenda.listOfferings(barber.id);
    const service = offerings.find((item) => item.id === input.serviceId);
    if (!service) throw new DomainError('NOT_FOUND', 'Ese servicio no está en tu catálogo.');
    let startMin: number;
    try {
      startMin = parseDisplayTime(input.start);
    } catch {
      throw new DomainError('VALIDATION', 'Usa horas como 09:00 AM.');
    }
    const endMin = startMin + service.durationMinutes;
    const lunchEnd = plan.lunchStartMin + await this.agenda.lunchDuration();
    const latest = Math.max(22 * 60, plan.closeMin + 3 * 60);
    const fits = (startMin >= plan.openMin && endMin <= plan.lunchStartMin) || (startMin >= lunchEnd && endMin <= latest);
    if (!fits) throw new DomainError('INVALID_SCHEDULE', 'Ese turno cruza el almuerzo o queda antes de la apertura.');
    await this.agenda.openTurns(barber.id, input.date);
    const taken = await this.agenda.turnsOn(barber.id, utc);
    const busy = taken.some((turn) => (turn.status === 'open' || turn.status === 'booked') && startMin < turn.endMin && turn.startMin < endMin);
    if (busy) throw new DomainError('VALIDATION', 'Ese horario ya está ocupado.');
    await this.agenda.placeManualTurn({
      barberId: barber.id,
      date: utc,
      startMin,
      endMin,
      durationMinutes: service.durationMinutes,
      serviceId: service.id,
      isExtra: endMin > plan.closeMin,
    });
    return { ok: true };
  }

  async removeTurn(actor: Actor, id: string) {
    const barber = await this.requireBarber(actor);
    const result = await this.agenda.withdrawTurn(barber.id, id);
    if (result === 'missing') throw new DomainError('NOT_FOUND', 'No encontramos ese turno.');
    if (result === 'booked') throw new DomainError('INVALID_STATE', 'Ese turno ya tiene una cita.');
    return { ok: true };
  }

  private async weekIsLoaded(barberId: string) {
    const planned = await this.agenda.plannedWeekdays(barberId);
    return WEEK.every((day) => planned.includes(day));
  }

  private async requireBarber(actor: Actor) {
    assertRole(actor, ['barber']);
    const barber = await this.barbers.findByUserId(actor.id);
    if (!barber) throw new DomainError('NOT_FOUND', 'No encontramos tu perfil de barbero.');
    return barber;
  }
}

function calendarUtc(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

export function presentPreview(preview: AgendaResult) {
  return {
    needsCounts: preview.needsCounts,
    needsSpecialTime: preview.needsSpecialTime,
    suggestions: preview.suggestions,
    remainderMinutes: preview.remainderMinutes,
    groups: preview.groups.map((group) => ({
      durationMinutes: group.durationMinutes,
      kind: group.kind,
      serviceIds: group.services.map((service) => service.id),
      names: group.services.map((service) => service.name),
      count: group.count,
      maxCount: group.maxCount,
    })),
    extra: preview.extra
      ? {
          serviceId: preview.extra.serviceId,
          extensionMinutes: preview.extra.extensionMinutes,
          start: formatDisplayTime(preview.extra.startMin),
          end: formatDisplayTime(preview.extra.endMin),
          departure: formatDisplayTime(preview.extra.effectiveCloseMin),
        }
      : null,
    turns: preview.turns.map((turn) => ({
      start: formatDisplayTime(turn.startMin),
      end: formatDisplayTime(turn.endMin),
      durationMinutes: turn.durationMinutes,
      serviceId: turn.serviceId,
      isExtra: turn.isExtra,
      placedByBarber: turn.placedByBarber,
    })),
    effectiveClose: formatDisplayTime(preview.effectiveCloseMin),
  };
}
