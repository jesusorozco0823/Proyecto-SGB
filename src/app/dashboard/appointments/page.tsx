
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import type { Appointment } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FeedbackDialog from '@/components/feedback-dialog';
import AppointmentDetailsDialog from '@/components/appointment-details-dialog';
import CancelAppointmentDialog from '@/components/cancel-appointment-dialog';
import { useToast } from '@/hooks/use-toast';
import AppointmentReceiptDialog from '@/components/appointment-receipt-dialog';
import { RepeatVisit } from '@/components/repeat-visit';

function dayKey(value: Date) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

function shiftDay(key: string, amount: number) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    date.setDate(date.getDate() + amount);
    return dayKey(date);
}

function dateFromKey(key: string) {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function statusTone(status: Appointment['status'], deposit?: Appointment['depositStatus']): StatusTone {
    if (status === 'completed') return 'completed';
    if (status === 'cancelled') return 'cancelled';
    if (status === 'no_show') return 'no_show';
    if (deposit === 'pending') return 'deposit_pending';
    return 'scheduled';
}

export default function AppointmentsPage() {
    const { role } = useAuth();
    const { toast } = useToast();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [feedbackAppointment, setFeedbackAppointment] = useState<Appointment | null>(null);
    const [viewingAppointment, setViewingAppointment] = useState<Appointment | null>(null);
    const [cancellingAppointment, setCancellingAppointment] = useState<Appointment | null>(null);
    const [receiptAppointmentId, setReceiptAppointmentId] = useState<string | null>(null);
    const todayKey = dayKey(new Date());
    const [day, setDay] = useState(todayKey);
    const [showAll, setShowAll] = useState(false);
    const [onlyPending, setOnlyPending] = useState(false);

    useEffect(() => {
        if (!role) return;
        apiClient.get<Appointment[]>('/api/v1/appointments')
            .then((rows) => setAppointments(rows.map((row) => ({ ...row, datetime: new Date(row.datetime) }))))
            .catch((error) => {
                toast({
                    title: 'No se pudieron cargar las citas',
                    description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
                    variant: 'destructive',
                });
            });
    }, [role, toast]);

    const getAppointmentDetails = (appt: Appointment) => ({
        client: appt.client,
        barber: appt.barber,
        services: appt.services ?? [],
    });

    const handleFeedbackSubmit = async (rating: number, comment: string) => {
        if (!feedbackAppointment) return;
        await apiClient.post(`/api/v1/appointments/${feedbackAppointment.id}/feedback`, { rating, comment });
        setAppointments(prev =>
            prev.map(appt =>
                appt.id === feedbackAppointment.id
                    ? { ...appt, rating, comment }
                    : appt
            )
        );
        toast({
            title: "¡Gracias por tu opinión!",
            description: "Tus comentarios nos ayudan a mejorar.",
        });
        setFeedbackAppointment(null);
    }

    const handleCancelSubmit = async (reason: string) => {
        if (!cancellingAppointment) return;
        await apiClient.post(`/api/v1/appointments/${cancellingAppointment.id}/cancel`, { reason });
        setAppointments(prev =>
            prev.map(appt =>
                appt.id === cancellingAppointment.id
                    ? { ...appt, status: 'cancelled', cancellationReason: reason }
                    : appt
            )
        );
        toast({
            title: "Cita Cancelada",
            description: "Tu cita ha sido cancelada exitosamente.",
        });
        setCancellingAppointment(null);
    };

    const handleComplete = async (appointmentId: string) => {
        await apiClient.post(`/api/v1/appointments/${appointmentId}/complete`);
        setAppointments(prev => prev.map(appt => appt.id === appointmentId ? { ...appt, status: 'completed' } : appt));
        toast({ title: 'Cita completada', description: 'La cita quedó marcada como completada.' });
    };

    const runAction = async (path: string, success: string, apply: (appt: Appointment) => Appointment) => {
        try {
            await apiClient.post(path);
            const id = path.split('/')[4];
            setAppointments((prev) => prev.map((appt) => appt.id === id ? apply(appt) : appt));
            toast({ title: success });
        } catch (error) {
            toast({ title: 'No se pudo completar', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
        }
    };
    
    const pageTitle = {
        admin: 'Todas las Citas',
        superadmin: 'Todas las Citas',
        client: 'Mis Citas',
        barber: 'Mis Citas Asignadas'
    }[role || 'client'];

    const pageDescription = {
        admin: 'Ver y gestionar todas las citas programadas.',
        superadmin: 'Ver y gestionar todas las citas programadas.',
        client: 'Revisa tus citas próximas y pasadas.',
        barber: 'Las confirmadas se ven aparte. Las que no responden quedan para un WhatsApp.'
    }[role || 'client'];

    const onDay = showAll ? appointments : appointments.filter((appt) => dayKey(new Date(appt.datetime)) === day);
    const visible = (onlyPending ? onDay.filter((appt) => appt.status === 'scheduled') : onDay)
        .slice()
        .sort((left, right) => showAll
            ? +new Date(right.datetime) - +new Date(left.datetime)
            : +new Date(left.datetime) - +new Date(right.datetime));
    const rawDay = format(dateFromKey(day), "EEEE d 'de' MMMM", { locale: es });
    const dayLabel = rawDay.charAt(0).toUpperCase() + rawDay.slice(1);
    const summary = showAll ? `${visible.length} en total` : `${dayLabel} · ${visible.length}`;
    const emptyCopy = visible.length > 0
        ? ''
        : onlyPending
            ? (showAll ? 'No hay citas pendientes.' : `No hay citas pendientes el ${dayLabel}.`)
            : (showAll ? 'No tienes citas.' : `No hay citas el ${dayLabel}.`);

    const latestId = appointments
        .filter((appt) => appt.status !== 'cancelled' && appt.barberId && (appt.services?.[0]?.id || appt.serviceIds[0]))
        .sort((left, right) => +new Date(right.datetime) - +new Date(left.datetime))[0]?.id;

    const answerAttendance = async (id: string, answer: 'confirmed' | 'declined') => {
        try {
            const updated = await apiClient.post<Appointment>(`/api/v1/appointments/${id}/attendance`, { answer });
            setAppointments((prev) => prev.map((appt) => appt.id === id ? { ...appt, ...updated, datetime: new Date(updated.datetime) } : appt));
            toast({ title: answer === 'confirmed' ? 'Quedó anotado que vas' : 'Avisaste que no vas', description: answer === 'declined' ? 'El turno quedó libre.' : 'El barbero ya lo ve confirmado.' });
        } catch (error) {
            toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
        }
    };

    const appointmentActions = (appt: Appointment) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" className="h-11 w-11 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Alternar menú</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setViewingAppointment(appt)}>Ver Detalles</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setReceiptAppointmentId(appt.id)}>Comprobante</DropdownMenuItem>
                {(role === 'admin' || role === 'barber') && appt.status === 'scheduled' && <DropdownMenuItem onSelect={() => handleComplete(appt.id)}>Marcar completada</DropdownMenuItem>}
                {(role === 'admin' || role === 'barber') && appt.status === 'scheduled' && <DropdownMenuItem onSelect={() => runAction(`/api/v1/appointments/${appt.id}/no-show`, 'Inasistencia registrada', (item) => ({ ...item, status: 'no_show' }))}>Marcar inasistencia</DropdownMenuItem>}
                {role === 'admin' && appt.depositStatus === 'pending' && <DropdownMenuItem onSelect={() => runAction(`/api/v1/appointments/${appt.id}/deposit`, 'Abono confirmado', (item) => ({ ...item, depositStatus: 'paid' }))}>Confirmar abono</DropdownMenuItem>}
                {(role === 'client' || role === 'admin') && appt.status === 'scheduled' && <DropdownMenuItem onSelect={() => setCancellingAppointment(appt)}>Cancelar</DropdownMenuItem>}
                {(role === 'admin' || role === 'barber') && appt.client && <DropdownMenuItem onSelect={() => apiClient.get(`/api/v1/clients/${appt.client?.id}/card`).then((card) => toast({ title: (card as { displayName: string }).displayName, description: `Preferencias: ${((card as { preferences: string[] }).preferences || []).join(', ') || 'sin preferencias'}` })).catch((error) => toast({ title: 'No se pudo abrir la ficha', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Ficha del cliente</DropdownMenuItem>}
                {role === 'admin' && appt.client && <DropdownMenuItem onSelect={() => apiClient.post(`/api/v1/clients/${appt.client?.id}/card`, { reason: 'Bloqueado desde citas' }).then(() => toast({ title: 'Cliente bloqueado' })).catch((error) => toast({ title: 'No se pudo bloquear', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Bloquear cliente</DropdownMenuItem>}
                {role === 'client' && appt.status === 'completed' && !appt.rating && <DropdownMenuItem onSelect={() => setFeedbackAppointment(appt)}>Dejar Opinión</DropdownMenuItem>}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>{pageTitle}</CardTitle>
                    <CardDescription>
                        {pageDescription}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl border bg-background p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="mr-1 text-sm text-muted-foreground">Día</span>
                                {[
                                    { label: 'Hoy', value: todayKey },
                                    { label: 'Mañana', value: shiftDay(todayKey, 1) },
                                ].map((option) => {
                                    const selected = !showAll && day === option.value;
                                    return (
                                        <Button
                                            key={option.label}
                                            type="button"
                                            variant={selected ? 'default' : 'outline'}
                                            className="h-10 rounded-full px-4"
                                            onClick={() => { setShowAll(false); setDay(option.value); }}
                                        >
                                            {option.label}
                                        </Button>
                                    );
                                })}
                                <Input
                                    type="date"
                                    aria-label="Elegir día"
                                    value={showAll ? '' : day}
                                    onChange={(event) => {
                                        if (!event.target.value) return;
                                        setShowAll(false);
                                        setDay(event.target.value);
                                    }}
                                    className="h-10 w-40 rounded-full"
                                />
                                <Button type="button" variant={showAll ? 'default' : 'ghost'} className="h-10 rounded-full px-4" onClick={() => setShowAll(true)}>
                                    Todas
                                </Button>
                            </div>
                            <p className="text-sm text-muted-foreground">{summary}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                            <span className="mr-1 text-sm text-muted-foreground">Estado</span>
                            <Button
                                type="button"
                                variant={onlyPending ? 'default' : 'outline'}
                                className="h-10 rounded-full px-4"
                                onClick={() => setOnlyPending(true)}
                            >
                                Pendientes
                            </Button>
                            <Button
                                type="button"
                                variant={onlyPending ? 'ghost' : 'default'}
                                className="h-10 rounded-full px-4"
                                onClick={() => setOnlyPending(false)}
                            >
                                Todas
                            </Button>
                        </div>
                    </div>
                    {visible.length === 0 && <p className="py-12 text-center text-muted-foreground">{emptyCopy}</p>}
                    <div className="mx-auto w-full max-w-3xl space-y-3">
                        {visible.map((appt) => {
                            const { client, barber, services } = getAppointmentDetails(appt);
                            return (
                                <article key={appt.id} className="rounded-2xl border bg-background p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 space-y-1">
                                            <p className="font-medium break-words">{services.map((service) => service.name).join(', ') || 'Sin servicio'}</p>
                                            <p className="text-sm text-muted-foreground">{format(appt.datetime, "d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}</p>
                                            {(role === 'admin' || role === 'superadmin' || role === 'barber') && client && <p className="text-sm break-words">{client.displayName}</p>}
                                            {(role === 'admin' || role === 'superadmin' || role === 'client') && barber && <p className="text-sm text-muted-foreground break-words">{barber.name}</p>}
                                        </div>
                                        {appointmentActions(appt)}
                                    </div>
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <StatusBadge tone={statusTone(appt.status, appt.depositStatus)} />
                                        {appt.status === 'scheduled' && <StatusBadge tone={appt.attendance === 'confirmed' ? 'going' : 'unconfirmed'} />}
                                    </div>
                                    {role === 'client' && appt.status === 'scheduled' && new Date(appt.datetime).getTime() > Date.now() && (
                                        <div className="mt-3 flex gap-2">
                                            {appt.attendance !== 'confirmed' && <Button size="sm" onClick={() => void answerAttendance(appt.id, 'confirmed')}>Sí voy</Button>}
                                            <Button size="sm" variant="outline" onClick={() => void answerAttendance(appt.id, 'declined')}>No voy</Button>
                                        </div>
                                    )}
                                    {role === 'client' && appt.id === latestId && (
                                        <Button asChild variant="secondary" size="sm" className="mt-3">
                                            <Link href={`/dashboard/book?barber=${appt.barberId}&service=${appt.services?.[0]?.id ?? appt.serviceIds[0]}`}>Igual que la última vez</Link>
                                        </Button>
                                    )}
                                    {role === 'admin' && appt.client && (
                                        <div className="mt-3">
                                            <RepeatVisit appointment={appt} onBooked={() => apiClient.get<Appointment[]>('/api/v1/appointments').then((rows) => setAppointments(rows.map((row) => ({ ...row, datetime: new Date(row.datetime) }))))} />
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
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
            {viewingAppointment && (
                <AppointmentDetailsDialog
                    isOpen={!!viewingAppointment}
                    onOpenChange={() => setViewingAppointment(null)}
                    appointment={viewingAppointment}
                />
            )}
            {cancellingAppointment && (
                <CancelAppointmentDialog
                    isOpen={!!cancellingAppointment}
                    onOpenChange={() => setCancellingAppointment(null)}
                    onSubmit={handleCancelSubmit}
                />
            )}
            <AppointmentReceiptDialog appointmentId={receiptAppointmentId} onOpenChange={(open) => { if (!open) setReceiptAppointmentId(null); }} />
        </>
    );
}
