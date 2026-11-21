export const CREDIT_STATUSES = [
  'pending_barber',
  'barber_rejected',
  'pending_admin',
  'admin_rejected',
  'active',
  'closed',
] as const;

export type CreditStatus = (typeof CREDIT_STATUSES)[number];
export type CreditKind = 'owed' | 'prepaid';
export type CreditMeasure = 'cuts' | 'budget';

export const ADMIN_VISIBLE_STATUSES = ['pending_admin', 'admin_rejected', 'active', 'closed'] as const satisfies readonly CreditStatus[];

export function hiddenFromAdmin(status: CreditStatus) {
  return status === 'pending_barber' || status === 'barber_rejected';
}

export const OPEN_STATUSES = ['pending_barber', 'pending_admin', 'active'] as const satisfies readonly CreditStatus[];
