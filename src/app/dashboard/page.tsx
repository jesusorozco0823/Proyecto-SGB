"use client";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Warehouse, Scissors, DollarSign, Clock } from "lucide-react";
import Link from 'next/link';

function AdminDashboard() {
    const stats = [
        { title: "Today's Appointments", value: 12, icon: Calendar, color: "text-blue-500" },
        { title: "Weekly Revenue", value: "$3,450", icon: DollarSign, color: "text-green-500" },
        { title: "New Clients", value: 7, icon: Users, color: "text-purple-500" },
        { title: "Low Stock Items", value: 3, icon: Warehouse, color: "text-red-500" },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Admin Overview</h1>
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
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Manage your salon efficiently.</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild><Link href="/dashboard/appointments">View All Appointments</Link></Button>
                    <Button asChild variant="secondary"><Link href="/dashboard/inventory">Manage Inventory</Link></Button>
                    <Button asChild variant="secondary"><Link href="/dashboard/barbers">Update Barber Schedules</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}

function ClientDashboard() {
     return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold font-headline">Welcome back, Alex!</h1>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader>
                        <CardTitle>Book Your Next Visit</CardTitle>
                        <CardDescription className="text-primary-foreground/80">Fresh look? Right this way.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                           <Link href="/dashboard/book">
                                <Scissors className="mr-2 h-4 w-4" />
                                Find a Slot
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Upcoming Appointment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground"/>
                            <p className="font-semibold">Tuesday, June 28th at 3:00 PM</p>
                        </div>
                         <div className="flex items-center gap-2">
                            <Scissors className="h-5 w-5 text-muted-foreground"/>
                            <p>with Javier "The Blade" Rodriguez</p>
                        </div>
                        <Button variant="outline" className="w-full md:w-auto mt-2">Manage Appointment</Button>
                    </CardContent>
                </Card>
            </div>

             <Card>
                <CardHeader>
                    <CardTitle>Your History</CardTitle>
                    <CardDescription>Review your past visits and favorite services.</CardDescription>
                </CardHeader>
                <CardContent>
                   <ul className="space-y-3">
                       <li className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground"/>
                            <div>
                               <p className="font-medium">Classic Haircut & Beard Trim</p>
                               <p className="text-sm text-muted-foreground">May 15, 2024 with Javier</p>
                            </div>
                           </div>
                           <Button variant="ghost" size="sm">Rebook</Button>
                       </li>
                        <li className="flex justify-between items-center">
                           <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-muted-foreground"/>
                            <div>
                               <p className="font-medium">Skin Fade</p>
                               <p className="text-sm text-muted-foreground">April 20, 2024 with Sam</p>
                            </div>
                           </div>
                           <Button variant="ghost" size="sm">Rebook</Button>
                       </li>
                   </ul>
                   <Button variant="link" className="p-0 h-auto mt-4"><Link href="/dashboard/appointments">View all history</Link></Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function DashboardPage() {
  const { role } = useAuth();
  
  if (role === 'admin') {
    return <AdminDashboard />;
  }

  // Client and Barber can share a similar dashboard for this prototype
  return <ClientDashboard />;
}
