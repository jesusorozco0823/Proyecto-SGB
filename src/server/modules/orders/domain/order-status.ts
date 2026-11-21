import type { Order } from '@/lib/types';

const NEXT_STATUS: Record<Order['status'], Order['status'][]> = {
  pending: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export function canChangeStatus(current: Order['status'], next: Order['status']) {
  return NEXT_STATUS[current].includes(next);
}
