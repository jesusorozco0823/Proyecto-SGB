
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Warehouse, Scissors, DollarSign, Clock, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCop } from "@/lib/money";

function money(value: number) {
    return formatCop(value);
}

type AdminStats = { role: 'admin'; appointmentsToday: number; weeklyRevenue: number; newClients: number; lowStock: number };
type BarberStats = { role: 'barber'; appointmentsToday: number; appointmentsWeek: number; weeklyRevenue: number };
type ClientStats = {
    role: 'client';
    nextAppointment: { datetime: string; barberName: string; serviceNames: string[] } | null;
    history: { datetime: string; barberName: string; serviceNames: string[] }[];
};

function AdminDashboard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [settings, setSettings] = useState({ durationMinutes: '60', depositAmount: '0', commissionPercent: '40', lowStockThreshold: '5' });
    const [alerts, setAlerts] = useState<{ id: string; name: string; stock: number }[]>([]);
    const [holiday, setHoliday] = useState('');
    const [holidayReason, setHolidayReason] = useState('');
    const [cash, setCash] = useState<string>('');

    useEffect(() => {
        apiClient.get<AdminStats>('/api/v1/stats').then(setStats).catch(() => setStats(null));
        apiClient.get<typeof settings>('/api/v1/salon-settings').then((policy) => setSettings({
            durationMinutes: String(policy.durationMinutes),
            depositAmount: String(policy.depositAmount),
            commissionPercent: String(policy.commissionPercent),
            lowStockThreshold: String(policy.lowStockThreshold),
        })).catch(() => undefined);
        apiClient.get<{ id: string; name: string; stock: number }[]>('/api/v1/stock-alerts').then(setAlerts).catch(() => setAlerts([]));
    }, []);

    const saveSettings = async () => {
        try {
            await apiClient.put('/api/v1/salon-settings', {
                durationMinutes: Number(settings.durationMinutes),
                depositAmount: Number(settings.depositAmount),
                commissionPercent: Number(settings.commissionPercent),
                lowStockThreshold: Number(settings.lowStockThreshold),
            });
            toast({ title: 'Ajustes del salón guardados' });
        } catch (error) {
            toast({ title: 'No se pudieron guardar los ajustes', description: error instanceof Error ? error.message : 'Revisa los valores.', variant: 'destructive' });
        }
    };

    const cards = [
        { title: "Citas de Hoy", value: stats?.appointmentsToday ?? '—', icon: Calendar },
        { title: "Ingresos Semanales", value: stats ? money(stats.weeklyRevenue) : '—', icon: DollarSign },
        { title: "Nuevos Clientes", value: stats?.newClients ?? '—', icon: Users },
        { title: "Productos con Bajo Stock", value: stats?.lowStock ?? '—', icon: Warehouse },
    ];
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Panel de Administrador</h1>
            <p className="text-muted-foreground">¡Bienvenido de nuevo, {user?.displayName}!</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary"><stat.icon className="h-4 w-4" /></span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>Gestiona tu salón de forma eficiente.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild><Link href="/dashboard/appointments">Ver Todas las Citas</Link></Button>
                    <Button asChild variant="secondary"><Link href="/dashboard/inventory">Gestionar Inventario</Link></Button>
                    <Button asChild variant="secondary"><Link href="/dashboard/barbers">Actualizar Horarios</Link></Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Ajustes del salón</CardTitle>
                    <CardDescription>Almuerzo, abono para apartar la cita, comisión del barbero y umbral de stock.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                    <Input type="number" value={settings.durationMinutes} onChange={(event) => setSettings({ ...settings, durationMinutes: event.target.value })} placeholder="Minutos de almuerzo" />
                    <Input type="number" aria-label="Abono para apartar la cita" value={settings.depositAmount} onChange={(event) => setSettings({ ...settings, depositAmount: event.target.value })} placeholder="Abono para apartar" />
                    <Input type="number" value={settings.commissionPercent} onChange={(event) => setSettings({ ...settings, commissionPercent: event.target.value })} placeholder="Comisión %" />
                    <Input type="number" value={settings.lowStockThreshold} onChange={(event) => setSettings({ ...settings, lowStockThreshold: event.target.value })} placeholder="Stock bajo" />
                    <Button onClick={saveSettings}>Guardar ajustes</Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Festivo y corte de caja</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Input type="date" value={holiday} onChange={(event) => setHoliday(event.target.value)} />
                        <Input value={holidayReason} onChange={(event) => setHolidayReason(event.target.value)} placeholder="Motivo del festivo" />
                        <Button variant="secondary" onClick={() => apiClient.post('/api/v1/holidays', { date: holiday, reason: holidayReason }).then(() => toast({ title: 'Festivo guardado' })).catch((error) => toast({ title: 'No se pudo guardar el festivo', description: error instanceof Error ? error.message : 'Revisa la fecha.', variant: 'destructive' }))}>Guardar festivo</Button>
                    </div>
                    <Button variant="outline" onClick={() => {
                        const today = new Date();
                        const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
                        const to = today.toISOString().slice(0, 10);
                        apiClient.get<{ serviceTotal: number; commission: number; productTotal: number; completedServices: number }>(`/api/v1/cash-cut?from=${from}&to=${to}`).then((result) => setCash(`${result.completedServices} servicios · servicios ${money(result.serviceTotal)} · comisión ${money(result.commission)} · productos ${money(result.productTotal)}`)).catch(() => setCash('No se pudo calcular el corte.'));
                    }}>Corte del mes</Button>
                    {cash && <p className="text-sm text-muted-foreground">{cash}</p>}
                    {alerts.map((alert) => (
                        <div key={alert.id} className="flex items-center justify-between text-sm">
                            <span>{alert.name} quedó en {alert.stock} unidades.</span>
                            <Button size="sm" variant="ghost" onClick={() => apiClient.post(`/api/v1/stock-alerts/${alert.id}`).then(() => setAlerts((current) => current.filter((item) => item.id !== alert.id)))}>Visto</Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function SuperAdminDashboard() {
     const { user } = useAuth();
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Panel de Super Administrador</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.displayName}. Tienes el control total del sistema.</p>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="h-6 w-6 text-destructive" />
                        <span>Gestión del Sistema</span>
                    </CardTitle>
                    <CardDescription>Añade o elimina administradores del sistema.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                       <Link href="/dashboard/admins">
                            <Users className="mr-2 h-4 w-4" />
                            Gestionar Administradores
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

type MonthPreview = { serviceTotal: number; completedServices: number; services: { name: string; count: number; total: number }[] };

function BarberDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<BarberStats | null>(null);
    const [month, setMonth] = useState<MonthPreview | null>(null);

    useEffect(() => {
        apiClient.get<BarberStats>('/api/v1/stats').then(setStats).catch(() => setStats(null));
        const today = new Date();
        const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
        const to = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        apiClient.get<MonthPreview>(`/api/v1/cash-cut?from=${from}&to=${to}`).then(setMonth).catch(() => setMonth(null));
    }, []);

    const cards = [
        { title: "Citas para Hoy", value: stats?.appointmentsToday ?? '—', icon: Calendar },
        { title: "Citas de la Semana", value: stats?.appointmentsWeek ?? '—', icon: Calendar },
        { title: "Ganancias de la Semana", value: stats ? money(stats.weeklyRevenue) : '—', icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">¡Bienvenido, {user?.displayName.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad.</p>
            <div className="grid gap-4 md:grid-cols-3">
                {cards.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary"><stat.icon className="h-4 w-4" /></span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                    <CardDescription>Gestiona tu agenda y disponibilidad.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button asChild><Link href="/dashboard/appointments">Ver Mis Citas</Link></Button>
                    <Button asChild variant="secondary"><Link href="/dashboard/schedule">Gestionar Mi Horario</Link></Button>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Resumen del mes</CardTitle>
                    <CardDescription>Plata y cantidad de cada servicio ya completado.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-6">
                        <div>
                            <p className="text-sm text-muted-foreground">Plata</p>
                            <p className="text-2xl font-bold">{month ? money(month.serviceTotal) : '—'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Recortes</p>
                            <p className="text-2xl font-bold">{month?.completedServices ?? '—'}</p>
                        </div>
                    </div>
                    <ul className="space-y-2">
                        {(month?.services ?? []).map((service) => (
                            <li key={service.name} className="flex items-center justify-between gap-3 text-sm">
                                <span>{service.name}</span>
                                <span className="text-muted-foreground">{service.count} · {money(service.total)}</span>
                            </li>
                        ))}
                        {month && month.services.length === 0 && <li className="text-sm text-muted-foreground">Este mes todavía no tienes recortes completados.</li>}
                    </ul>
                    <Button asChild variant="outline"><Link href="/dashboard/month">Ver recortes del mes</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}

function ClientDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState<ClientStats | null>(null);

    useEffect(() => {
        apiClient.get<ClientStats>('/api/v1/stats').then(setStats).catch(() => setStats(null));
    }, []);

    const nextAppointment = stats?.nextAppointment;
    const nextDate = nextAppointment ? format(new Date(nextAppointment.datetime), "EEEE d 'de' MMMM 'a las' h:mm a", { locale: es }) : null;
     return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">¡Bienvenido de nuevo, {user?.displayName.split(' ')[0]}!</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle>Reserva tu Próxima Visita</CardTitle>
                        <CardDescription className="text-primary-foreground/80">¿Un nuevo look? Por aquí.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                           <Link href="/dashboard/book">
                                <Scissors className="mr-2 h-4 w-4" />
                                Reservar Ahora
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Tu Próxima Cita</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {nextAppointment ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-muted-foreground"/>
                                    <p className="font-semibold capitalize">{nextDate}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Scissors className="h-5 w-5 text-muted-foreground"/>
                                    <p>con {nextAppointment.barberName}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-muted-foreground">No tienes citas programadas.</p>
                        )}
                        <Button asChild variant="outline" className="w-full md:w-auto mt-2">
                            <Link href="/dashboard/appointments">Gestionar Cita</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Tu Historial</CardTitle>
                    <CardDescription>Revisa tus visitas pasadas y servicios favoritos.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ul className="space-y-3">
                       {(stats?.history ?? []).map((visit) => (
                           <li key={visit.datetime} className="flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                <Clock className="h-5 w-5 text-muted-foreground"/>
                                <div>
                                   <p className="font-medium">{visit.serviceNames.join(' y ')}</p>
                                   <p className="text-sm text-muted-foreground">{format(new Date(visit.datetime), "d 'de' MMMM, yyyy", { locale: es })} con {visit.barberName}</p>
                                </div>
                               </div>
                               <Button asChild variant="ghost" size="sm">
                                    <Link href="/dashboard/book">Re-reservar</Link>
                               </Button>
                           </li>
                       ))}
                       {stats && stats.history.length === 0 && (
                           <li className="text-sm text-muted-foreground">Todavía no tienes visitas completadas.</li>
                       )}
                   </ul>
                   <div className="mt-4 flex flex-wrap gap-3">
                       <Button variant="link" className="h-auto p-0" asChild><Link href="/dashboard/appointments">Ver todo el historial</Link></Button>
                       <Button variant="link" className="h-auto p-0" asChild><Link href="/dashboard/opinions">Dejar una opinión</Link></Button>
                   </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
  const { role } = useAuth();
  
  if (role === 'superadmin') {
    return <SuperAdminDashboard />;
  }

  if (role === 'admin') {
    return <AdminDashboard />;
  }
  
  if (role === 'barber') {
      return <BarberDashboard />;
  }

  return <ClientDashboard />;
}
