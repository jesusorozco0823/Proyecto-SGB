
"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Scissors,
  Calendar,
  Warehouse,
  MessageSquare,
  Users,
  User,
  ShoppingBag,
  Package,
  ShieldCheck,
  Clock,
  MessageCircle,
  Wallet,
} from 'lucide-react';

const adminNavItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Todas las Citas', icon: Calendar },
  { href: '/dashboard/credits', label: 'Crédito', icon: Wallet },
  { href: '/dashboard/barbers', label: 'Barberos', icon: Users },
  { href: '/dashboard/inventory', label: 'Inventario', icon: Warehouse },
  { href: '/dashboard/orders', label: 'Pedidos', icon: Package },
  { href: '/dashboard/feedback', label: 'Opiniones', icon: MessageSquare },
  { href: '/dashboard/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/dashboard/reminders', label: 'Recordatorios', icon: Clock },
];

const superAdminNavItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/admins', label: 'Gestionar Admins', icon: ShieldCheck },
  { href: '/dashboard/appointments', label: 'Citas', icon: Calendar },
  { href: '/dashboard/credits', label: 'Crédito', icon: Wallet },
  { href: '/dashboard/audit', label: 'Bitácora', icon: ShieldCheck },
  { href: '/dashboard/messages', label: 'Mensajes', icon: MessageCircle },
]

const clientNavItems = [
  { href: '/dashboard/book', label: 'Reservar Cita', icon: Scissors },
  { href: '/dashboard/appointments', label: 'Mis Citas', icon: Calendar },
  { href: '/dashboard/credits', label: 'Crédito', icon: Wallet },
  { href: '/dashboard/opinions', label: 'Opiniones', icon: MessageSquare },
  { href: '/dashboard/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/dashboard/products', label: 'Productos', icon: ShoppingBag },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
];

const barberNavItems = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Mis Citas', icon: Calendar },
  { href: '/dashboard/credits', label: 'Crédito', icon: Wallet },
  { href: '/dashboard/schedule', label: 'Mi Horario', icon: Clock },
  { href: '/dashboard/turns', label: 'Turnos disponibles', icon: Calendar },
  { href: '/dashboard/month', label: 'Recortes del mes', icon: Scissors },
  { href: '/dashboard/messages', label: 'Mensajes', icon: MessageCircle },
  { href: '/dashboard/reminders', label: 'Recordatorios', icon: Clock },
  { href: '/dashboard/profile', label: 'Mi Perfil', icon: User },
];

export default function SidebarContent() {
    const { role } = useAuth();
    const pathname = usePathname();
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        if (!role) return;
        let stopped = false;
        const load = async () => {
            if (document.hidden) return;
            try {
                const rows = await apiClient.get<{ id: string }[]>('/api/v1/messages/unread');
                if (!stopped) setUnread(rows.length);
            } catch {
                if (!stopped) setUnread(0);
            }
        };
        void load();
        const timer = window.setInterval(load, 3000);
        return () => {
            stopped = true;
            window.clearInterval(timer);
        };
    }, [role]);

    const getNavItems = () => {
        switch (role) {
            case 'superadmin':
                return superAdminNavItems;
            case 'admin':
                return adminNavItems;
            case 'barber':
                return barberNavItems;
            default:
                return clientNavItems;
        }
    }
    const navItems = getNavItems();

    return (
        <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline">
                    <Scissors className="h-6 w-6 text-primary" />
                    <span className="">SGB Barberías</span>
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
                                    isActive && "bg-secondary text-primary",
                                    href === '/dashboard/messages' && unread > 0 && "bg-accent font-semibold text-primary"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span className="flex-1">{label}</span>
                                {href === '/dashboard/messages' && unread > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
                                        {unread}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
