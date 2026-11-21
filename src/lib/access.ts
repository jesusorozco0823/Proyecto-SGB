import type { UserRole } from '@/lib/types';

const prefixes: Record<UserRole, string[]> = {
  superadmin: ['/dashboard/admins', '/dashboard/appointments', '/dashboard/credits', '/dashboard/audit', '/dashboard/messages', '/dashboard/profile'],
  admin: [
    '/dashboard/appointments',
    '/dashboard/credits',
    '/dashboard/barbers',
    '/dashboard/inventory',
    '/dashboard/orders',
    '/dashboard/feedback',
    '/dashboard/messages',
    '/dashboard/reminders',
    '/dashboard/profile',
  ],
  barber: ['/dashboard/appointments', '/dashboard/credits', '/dashboard/schedule', '/dashboard/turns', '/dashboard/month', '/dashboard/messages', '/dashboard/reminders', '/dashboard/profile'],
  client: ['/dashboard/book', '/dashboard/appointments', '/dashboard/credits', '/dashboard/opinions', '/dashboard/messages', '/dashboard/products', '/dashboard/profile'],
};

export function canAccess(role: UserRole, pathname: string) {
  if (pathname === '/dashboard') return true;
  return prefixes[role].some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}
