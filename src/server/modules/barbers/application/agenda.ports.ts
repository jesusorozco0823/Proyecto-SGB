import type { AgendaPreview, PlannedTurn } from '@/server/modules/barbers/domain/turn-planner';

export type BarberOffering = {
  id: string;
  barberId: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string | null;
  isSpecial: boolean;
  active: boolean;
};

export type OfferingDraft = {
  name: string;
  durationMinutes: number;
  price: number;
  description: string | null;
  isSpecial: boolean;
};

export type StoredPlan = {
  dayOfWeek: number;
  openMin: number;
  closeMin: number;
  lunchStartMin: number;
  effectiveCloseMin: number;
  turns: PlannedTurn[];
};

export type OpenTurn = {
  id: string;
  startMin: number;
  endMin: number;
  durationMinutes: number;
  serviceId: string | null;
  isExtra: boolean;
};

export interface AgendaRepository {
  lunchDuration(): Promise<number>;
  depositAmount(): Promise<number>;
  setLunchDuration(minutes: number): Promise<number>;
  listOfferings(barberId: string): Promise<BarberOffering[]>;
  createOffering(barberId: string, input: OfferingDraft): Promise<BarberOffering>;
  updateOffering(barberId: string, id: string, input: Partial<OfferingDraft> & { active?: boolean }): Promise<BarberOffering | null>;
  savePlans(barberId: string, plans: StoredPlan[]): Promise<void>;
  plannedWeekdays(barberId: string): Promise<number[]>;
  planFor(barberId: string, dayOfWeek: number): Promise<{ openMin: number; closeMin: number; lunchStartMin: number; effectiveCloseMin: number } | null>;
  turnsOn(barberId: string, date: Date): Promise<{ id: string; startMin: number; endMin: number; status: 'open' | 'booked' | 'withdrawn'; templateId: string | null }[]>;
  placeManualTurn(input: { barberId: string; date: Date; startMin: number; endMin: number; durationMinutes: number; serviceId: string; isExtra: boolean }): Promise<void>;
  withdrawTurn(barberId: string, id: string): Promise<'missing' | 'booked' | 'ok'>;
  openTurns(barberId: string, date: string): Promise<OpenTurn[]>;
  isClosed(barberId: string, date: Date): Promise<boolean>;
}

export type AgendaResult = AgendaPreview & {
  effectiveCloseMin: number;
};
