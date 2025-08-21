"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Warehouse,
  MessageSquare,
  Users,
  User,
} from 'lucide-react';

const adminNavItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Todas las Citas', icon: Calendar },
  { href: '/dashboard/barbers', label: 'Barberos', icon: Users },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/dashboard/feedback', label: 'Opiniones', icon: MessageSquare },
];

const clientNavItems = [
  { href: '/dashboard/book', label: 'Reservar Cita', icon: Scissors },
  { href: '/dashboard/appointments', label: 'Mis Citas', icon: Calendar },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
];

export default function SidebarContent() {
    const { role } = useAuth();
    const pathname = usePathname();
    const navItems = role === 'admin' ? adminNavItems : clientNavItems;

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline">
                    <Scissors className="h-6 w-6 text-primary" />
                    <span className="">SalonFlow</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-2">
                <nav className="grid items-start px-4 text-sm font-medium">
                    {navItems.map(({ href, label, icon: Icon }) => {
                         const isActive = (href === '/dashboard' && pathname === href) || (href !== '/dashboard' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                                    isActive && "bg-secondary text-primary"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                {label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
