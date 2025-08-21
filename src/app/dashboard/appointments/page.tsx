"use client";
import { useAuth } from '@/hooks/use-auth';
import { mockAppointments, mockBarbers, mockServices, mockUsers } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function AppointmentsPage() {
    const { user, role } = useAuth();

    const appointments = role === 'admin'
        ? mockAppointments
        : mockAppointments.filter(a => a.userId === user?.id);

    const getAppointmentDetails = (appt: typeof mockAppointments[0]) => {
        const client = mockUsers.find(u => u.id === appt.userId);
        const barber = mockBarbers.find(b => b.id === appt.barberId);
        const services = mockServices.filter(s => appt.serviceIds.includes(s.id));
        return { client, barber, services };
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{role === 'admin' ? 'All Appointments' : 'My Appointments'}</CardTitle>
                <CardDescription>
                    {role === 'admin' ? 'View and manage all scheduled appointments.' : 'Review your upcoming and past appointments.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            {role === 'admin' && <TableHead>Client</TableHead>}
                            <TableHead>Barber</TableHead>
                            <TableHead>Services</TableHead>
                            <TableHead>Date & Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Actions</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointments.map(appt => {
                            const { client, barber, services } = getAppointmentDetails(appt);
                            return (
                                <TableRow key={appt.id}>
                                    {role === 'admin' && <TableCell>{client?.displayName}</TableCell>}
                                    <TableCell>{barber?.name}</TableCell>
                                    <TableCell>{services.map(s => s.name).join(', ')}</TableCell>
                                    <TableCell>{format(appt.datetime, "MMMM d, yyyy 'at' h:mm a")}</TableCell>
                                    <TableCell>
                                        <Badge variant={appt.status === 'completed' ? 'default' : appt.status === 'scheduled' ? 'secondary' : 'destructive'}>
                                            {appt.status}
                                        </Badge>
                                    </TableCell>
                                     <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                    <span className="sr-only">Toggle menu</span>
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                                {appt.status === 'scheduled' && <DropdownMenuItem>Cancel</DropdownMenuItem>}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
                 {appointments.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">You have no appointments.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
