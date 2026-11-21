import type { Service } from '@/lib/types';

export type AppointmentView = {
  id: string;
  userId: string;
  barberId: string;
  serviceIds: string[];
  datetime: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show';
  attendance: 'pending' | 'confirmed' | 'declined';
  cancellationReason?: string;
  depositStatus: 'waived' | 'pending' | 'paid';
  depositAmount: number;
  rating?: number;
  comment?: string;
  client: { id: string; displayName: string; avatarUrl?: string };
  barber: { id: string; name: string; userId: string };
  services: Service[];
};

export type BookingLine = {
  serviceId: string;
  price: number;
  duration: number;
};

export interface AppointmentRepository {
  listAll(): Promise<AppointmentView[]>;
  listByClient(userId: string): Promise<AppointmentView[]>;
  listByBarberUser(userId: string): Promise<AppointmentView[]>;
  findById(id: string): Promise<AppointmentView | null>;
  userExists(id: string): Promise<boolean>;
  findBarber(id: string): Promise<{ id: string; userId: string; rows: { dayOfWeek: number; startMin: number | null; endMin: number | null }[] } | null>;
  findActiveServices(ids: string[]): Promise<Service[]>;
  findOpenTurn(id: string): Promise<{
    id: string;
    barberId: string;
    date: Date;
    startMin: number;
    endMin: number;
    durationMinutes: number;
    serviceId: string | null;
    status: 'open' | 'booked' | 'withdrawn';
  } | null>;
  findOffering(id: string): Promise<{ id: string; barberId: string; name: string; durationMinutes: number; price: number; active: boolean } | null>;
  clientGate(userId: string): Promise<{ blocked: boolean; activeAppointments: number }>;
  depositAmount(): Promise<number>;
  bookTurn(input: { userId: string; barberId: string; dayTurnId: string; barberServiceId: string; startsAt: Date; endsAt: Date; depositStatus: 'waived' | 'pending'; depositAmount: number }): Promise<AppointmentView>;
  markCancelled(id: string, reason: string): Promise<AppointmentView>;
  markCompleted(id: string): Promise<AppointmentView>;
  markNoShow(id: string): Promise<AppointmentView>;
  markDepositPaid(id: string): Promise<AppointmentView>;
  markAttendance(id: string, attendance: 'pending' | 'confirmed' | 'declined'): Promise<AppointmentView>;
  tellBarber(input: { barberUserId: string; clientId: string; clientName: string; serviceName: string; whenLabel: string }): Promise<void>;
  sendDueReminders(): Promise<void>;
  offerFreedTurn(input: {
    barberId: string;
    barberUserId: string;
    serviceId: string | null;
    date: Date;
    dateKey: string;
    whenLabel: string;
    serviceName: string;
    excludeUserId: string;
  }): Promise<void>;
}
