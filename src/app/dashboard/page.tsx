
"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Warehouse, Scissors, DollarSign, Clock, ShieldCheck, User } from "lucide-react";
import Link from 'next/link';

function AdminDashboard() {
    const stats = [
        { title: "Citas de Hoy", value: 12, icon: Calendar, color: "text-blue-500" },
        { title: "Ingresos Semanales", value: "$3,450", icon: DollarSign, color: "text-green-500" },
        { title: "Nuevos Clientes", value: 7, icon: Users, color: "text-purple-500" },
        { title: "Productos con Bajo Stock", value: 3, icon: Warehouse, color: "text-red-500" },
    ];
    const { user } = useAuth();
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Panel de Administrador</h1>
            <p className="text-muted-foreground">¡Bienvenido de nuevo, {user?.displayName}!</p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
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

function BarberDashboard() {
    const { user } = useAuth();
    const stats = [
        { title: "Citas para Hoy", value: 5, icon: Calendar, color: "text-blue-500" },
        { title: "Citas de la Semana", value: 23, icon: Calendar, color: "text-purple-500" },
        { title: "Ganancias de la Semana", value: "$850", icon: DollarSign, color: "text-green-500" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">¡Bienvenido, {user?.displayName.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad.</p>
            <div className="grid gap-4 md:grid-cols-3">
                {stats.map(stat => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
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
        </div>
    );
}

function ClientDashboard() {
    const { user } = useAuth();
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
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground"/>
                            <p className="font-semibold">Martes, 28 de junio a las 3:00 PM</p>
                        </div>
                         <div className="flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-muted-foreground"/>
                            <p>con Javier "La Navaja" Rodriguez</p>
                        </div>
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
                       <li className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground"/>
                            <div>
                               <p className="font-medium">Corte Clásico y Arreglo de Barba</p>
                               <p className="text-sm text-muted-foreground">15 de mayo, 2024 con Javier</p>
                            </div>
                           </div>
                           <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/book">Re-reservar</Link>
                           </Button>
                       </li>
                        <li className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground"/>
                            <div>
                               <p className="font-medium">Corte Degradado (Fade)</p>
                               <p className="text-sm text-muted-foreground">20 de abril, 2024 con Sam</p>
                            </div>
                           </div>
                           <Button asChild variant="ghost" size="sm">
                                <Link href="/dashboard/book">Re-reservar</Link>
                           </Button>
                       </li>
                   </ul>
                   <Button variant="link" className="p-0 h-auto mt-4"><Link href="/dashboard/appointments">Ver todo el historial</Link></Button>
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
