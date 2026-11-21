'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export function RepeatVisit({ appointment, onBooked }: { appointment: Appointment; onBooked: () => void }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => {
    const next = new Date();
    next.setDate(next.getDate() + 1);
    return next.toISOString().slice(0, 10);
  });
  const [turns, setTurns] = useState<{ id: string; start: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const serviceId = appointment.services?.[0]?.id ?? appointment.serviceIds[0];

  useEffect(() => {
    if (!open || !serviceId) return;
    apiClient
      .get<{ turns: { id: string; start: string }[] }>(`/api/v1/barbers/${appointment.barberId}/turns?date=${date}&serviceId=${serviceId}`)
      .then((result) => setTurns(result.turns ?? []))
      .catch(() => setTurns([]));
  }, [open, date, serviceId, appointment.barberId]);

  if (!serviceId || !appointment.client) return null;

  const book = async (turnId: string) => {
    setBusy(true);
    try {
      await apiClient.post('/api/v1/appointments', {
        userId: appointment.userId,
        barberId: appointment.barberId,
        barberServiceId: serviceId,
        dayTurnId: turnId,
      });
      toast({ title: 'Cita reservada', description: `${appointment.client?.displayName} quedó con el mismo servicio.` });
      setOpen(false);
      onBooked();
    } catch (error) {
      toast({ title: 'No se pudo reservar', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>Reservar lo mismo</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reservar lo mismo</DialogTitle>
            <DialogDescription>{appointment.client.displayName} · {appointment.services?.[0]?.name ?? 'El servicio de la última cita'}</DialogDescription>
          </DialogHeader>
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Día del nuevo turno" />
          <div className="grid grid-cols-2 gap-2">
            {turns.map((turn) => (
              <Button key={turn.id} variant="outline" disabled={busy} onClick={() => void book(turn.id)}>{turn.start}</Button>
            ))}
          </div>
          {turns.length === 0 && <p className="text-sm text-muted-foreground">No hay turnos de ese servicio ese día.</p>}
        </DialogContent>
      </Dialog>
    </>
  );
}
