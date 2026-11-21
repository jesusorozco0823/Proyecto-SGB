import type { CreditKind, CreditMeasure, CreditStatus } from '@/server/modules/credits/domain/credit';

export type CreditRecord = {
  id: string;
  clientId: string;
  clientName: string;
  barberId: string;
  barberName: string;
  barberUserId: string;
  kind: CreditKind;
  note: string | null;
  status: CreditStatus;
  measure: CreditMeasure | null;
  limitCuts: number | null;
  limitAmount: number | null;
  usedCuts: number;
  usedAmount: number;
  createdAt: Date;
};

export type CreditBarberOption = { id: string; name: string; userId: string };

export type ChargeableAppointment = {
  id: string;
  service: string;
  when: string;
  price: number;
};

export type CreditRepository = {
  barbersForClient(clientId: string): Promise<CreditBarberOption[]>;
  barberIdForUser(userId: string): Promise<string | null>;
  openForPair(clientId: string, barberId: string): Promise<boolean>;
  create(input: { clientId: string; barberId: string; kind: CreditKind; note: string | null }): Promise<CreditRecord>;
  require(id: string): Promise<CreditRecord | null>;
  listForClient(clientId: string): Promise<CreditRecord[]>;
  listForBarber(barberId: string): Promise<CreditRecord[]>;
  listForAdmin(): Promise<CreditRecord[]>;
  usersByRole(roles: Array<'admin' | 'superadmin'>): Promise<Array<{ id: string }>>;
  markBarber(id: string, status: 'barber_rejected' | 'pending_admin'): Promise<CreditRecord>;
  markAdmin(id: string, input: {
    status: 'admin_rejected' | 'active' | 'closed';
    adminUserId: string;
    kind?: CreditKind;
    measure?: CreditMeasure | null;
    limitCuts?: number | null;
    limitAmount?: number | null;
  }): Promise<CreditRecord>;
  chargeable(record: Pick<CreditRecord, 'id' | 'clientId' | 'barberId'>): Promise<ChargeableAppointment[]>;
  charge(creditId: string, appointmentId: string): Promise<CreditRecord>;
  tell(senderId: string, recipientId: string, body: string): Promise<void>;
};
