"use client";
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { mockAppointments, mockBarbers, mockServices, mockUsers } from '@/lib/mock-data';
import type { Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import FeedbackDialog from '@/components/feedback-dialog';

export default function AppointmentsPage() {
    const { user, role } = useAuth();
    const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);

    const appointments = role === 'admin'
        ? mockAppointments
        : mockAppointments.filter(a => a.userId === user?.id);

    const getAppointmentDetails = (appt: typeof mockAppointments[0]) => {
        const client = mockUsers.find(u => u.id === appt.userId);
        const barber = mockBarbers.find(b => b.id === appt.barberId);
        const services = mockServices.filter(s => appt.serviceIds.includes(s.id));
        return { client, barber, services };
    };

    const handleFeedbackSubmit = () => {
        console.log("Feedback submitted!");
        // En una app real, aquí se enviaría el feedback a la base de datos.
        setFeedbackAppointment(null); // Cierra el diálogo
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{role === 'admin' ? 'Todas las Citas' : 'Mis Citas'}</CardTitle>
                    <CardDescription>
                        {role === 'admin' ? 'Ver y gestionar todas las citas programadas.' : 'Revisa tus citas próximas y pasadas.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {role === 'admin' && <TableHead>Cliente</TableHead>}
                                <TableHead>Barbero</TableHead>
                                <TableHead>Servicios</TableHead>
                                <TableHead>Fecha y Hora</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead><span className="sr-only">Acciones</span></TableHead>
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
                                        <TableCell>{format(appt.datetime, "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}</TableCell>
                                        <TableCell>
                                            <Badge variant={appt.status === 'completed' ? 'default' : appt.status === 'scheduled' ? 'secondary' : 'destructive'}>
                                                {appt.status === 'completed' ? 'Completada' : appt.status === 'scheduled' ? 'Programada' : 'Cancelada'}
                                            </Badge>
                                        </TableCell>
                                         <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Alternar menú</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                    <DropdownMenuItem>Ver Detalles</DropdownMenuItem>
                                                    {appt.status === 'scheduled' && <DropdownMenuItem>Cancelar</DropdownMenuItem>}
                                                    {appt.status === 'completed' && <DropdownMenuItem onSelect={() => setFeedbackAppointment(appt)}>Dejar Opinión</DropdownMenuItem>}
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
                            <p className="text-muted-foreground">No tienes citas.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            {feedbackAppointment && (
                <FeedbackDialog
                    isOpen={!!feedbackAppointment}
                    onOpenChange={() => setFeedbackAppointment(null)}
                    appointment={feedbackAppointment}
                    onSubmit={handleFeedbackSubmit}
                />
            )}
        </>
    );
}