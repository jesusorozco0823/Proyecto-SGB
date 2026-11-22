"use client";

import { useEffect, useState } from 'react';
import { Clock, Utensils } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDisplayTime, parseDisplayTime, type DayKey, type WeekSchedule } from '@/server/shared/time/schedule-time';

const DAYS: { key: DayKey; label: string; short: string; weekday: number }[] = [
  { key: 'monday', label: 'Lunes', short: 'Lun', weekday: 1 },
  { key: 'tuesday', label: 'Martes', short: 'Mar', weekday: 2 },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié', weekday: 3 },
  { key: 'thursday', label: 'Jueves', short: 'Jue', weekday: 4 },
  { key: 'friday', label: 'Viernes', short: 'Vie', weekday: 5 },
  { key: 'saturday', label: 'Sábado', short: 'Sáb', weekday: 6 },
  { key: 'sunday', label: 'Domingo', short: 'Dom', weekday: 0 },
];

type Plan = { dayOfWeek: number; open: string; close: string; lunchStart: string; lunchEnd: string };
type BarberHours = { id: string; name: string; imageUrl: string; schedule: WeekSchedule; plans: Plan[] };
type Board = { lunchMinutes: number; barbers: BarberHours[] };

function toClock(display: string) {
  const minutes = parseDisplayTime(display);
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

function fromClock(value: string) {
  if (!value) return '';
  const [hour, minute] = value.split(':').map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return '';
  return formatDisplayTime(hour * 60 + minute);
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase();
}

export default function SalonHoursPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [board, setBoard] = useState<Board | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [lunch, setLunch] = useState('60');
  const [drafts, setDrafts] = useState<Record<string, WeekSchedule>>({});
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');

  const load = async () => {
    const next = await apiClient.get<Board>('/api/v1/salon-hours');
    setBoard(next);
    setLunch(String(next.lunchMinutes));
    setDrafts(Object.fromEntries(next.barbers.map((barber) => [barber.id, barber.schedule])));
  };

  useEffect(() => {
    if (role !== 'admin') return;
    setStatus('loading');
    load()
      .then(() => setStatus('ready'))
      .catch((error) => {
        setStatus('error');
        toast({ title: 'No se pudo cargar el horario', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
      });
  }, [role, toast]);

  const saveLunch = async () => {
    setBusy(true);
    try {
      await apiClient.put('/api/v1/lunch-policy', { durationMinutes: Number(lunch) });
      await load();
      toast({ title: 'Duración del almuerzo guardada' });
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : 'Revisa los minutos.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const saveSchedule = async (barber: BarberHours) => {
    const schedule = drafts[barber.id];
    setBusy(true);
    try {
      await apiClient.put(`/api/v1/barbers/${barber.id}/schedule`, schedule);
      toast({ title: 'Horario guardado', description: `La jornada de ${barber.name} quedó actualizada.` });
    } catch (error) {
      toast({ title: 'No se pudo guardar el horario', description: error instanceof Error ? error.message : 'Revisa las horas.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const setDay = (barberId: string, key: DayKey, open: boolean, start?: string, end?: string) => {
    setDrafts((current) => {
      const week = current[barberId];
      const previous = week[key];
      return {
        ...current,
        [barberId]: {
          ...week,
          [key]: open
            ? {
                start: start ?? previous?.start ?? '08:00 AM',
                end: end ?? previous?.end ?? '05:00 PM',
              }
            : null,
        },
      };
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Horario</h1>
        <p className="text-muted-foreground">La duración del almuerzo es del salón. Cada barbero elige a qué hora empieza, entre las 11:00 a. m. y las 2:00 p. m.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
              <Utensils className="h-4 w-4" />
            </span>
            Almuerzo
          </CardTitle>
          <CardDescription>Entre 15 y 120 minutos. El bloque completo tiene que caber dentro de la jornada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 rounded-2xl border bg-background p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-sm text-muted-foreground">Duración</span>
              <Input
                className="h-10 w-28 rounded-full"
                type="number"
                min={15}
                max={120}
                aria-label="Duración del almuerzo en minutos"
                value={lunch}
                onChange={(event) => setLunch(event.target.value)}
              />
              <span className="text-sm text-muted-foreground">minutos</span>
            </div>
            <Button type="button" className="h-10 rounded-full px-4" disabled={busy || status !== 'ready'} onClick={() => void saveLunch()}>
              Guardar almuerzo
            </Button>
          </div>
        </CardContent>
      </Card>

      {role === 'admin' && status === 'loading' && <p className="text-sm text-muted-foreground">Cargando horario…</p>}
      {status === 'error' && <p className="text-sm text-muted-foreground">No se pudo cargar el horario. Recarga la página para intentarlo otra vez.</p>}

      {board && board.barbers.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">Todavía no hay barberos.</CardContent>
        </Card>
      )}

      {board && board.barbers.length > 0 && (
        <Input className="h-10 max-w-md rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar barbero" aria-label="Buscar barbero" />
      )}
      <div className="mx-auto w-full max-w-3xl space-y-4">
        {(board?.barbers ?? []).filter((barber) => !query.trim() || barber.name.toLowerCase().includes(query.trim().toLowerCase())).map((barber) => {
          const draft = drafts[barber.id] ?? barber.schedule;
          return (
            <Card key={barber.id} className="flex flex-col overflow-hidden">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={barber.imageUrl} alt={barber.name} />
                    <AvatarFallback>{initials(barber.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="text-xl">{barber.name}</CardTitle>
                    <CardDescription>
                      {barber.plans.length === 0
                        ? 'Aún no cargó la semana. Aquí defines la jornada en la que puede atender.'
                        : 'Semana cargada. La hora de almuerzo es la que eligió al armar los turnos.'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                {barber.plans.length > 0 && (
                  <div className="space-y-2">
                    {barber.plans.map((plan) => {
                      const day = DAYS.find((item) => item.weekday === plan.dayOfWeek);
                      return (
                        <article key={plan.dayOfWeek} className="rounded-2xl border bg-background p-3">
                          <p className="font-medium">{day?.label}</p>
                          <p className="text-sm text-muted-foreground">{plan.open} a {plan.close}</p>
                          <p className="mt-1 flex items-center gap-1 text-sm">
                            <Utensils className="h-3.5 w-3.5 text-primary" />
                            {plan.lunchStart} a {plan.lunchEnd}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
                <div className="space-y-2">
                  {DAYS.map((day) => {
                    const window = draft[day.key];
                    return (
                      <div key={day.key} className="flex flex-wrap items-center gap-2 rounded-2xl border bg-background px-3 py-2">
                        <span className="flex w-24 items-center gap-2 text-sm font-medium">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          {day.short}
                        </span>
                        <Button
                          type="button"
                          variant={window ? 'default' : 'outline'}
                          className="h-10 rounded-full px-4"
                          onClick={() => setDay(barber.id, day.key, !window)}
                        >
                          {window ? 'Abre' : 'Cerrado'}
                        </Button>
                        {window && (
                          <>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              Apertura
                              <Input
                                className="h-10 w-[7.5rem] rounded-full"
                                type="time"
                                aria-label={`Apertura del ${day.label}`}
                                value={toClock(window.start)}
                                onChange={(event) => {
                                  const start = fromClock(event.target.value);
                                  if (start) setDay(barber.id, day.key, true, start, window.end);
                                }}
                              />
                            </label>
                            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                              Cierre
                              <Input
                                className="h-10 w-[7.5rem] rounded-full"
                                type="time"
                                aria-label={`Cierre del ${day.label}`}
                                value={toClock(window.end)}
                                onChange={(event) => {
                                  const end = fromClock(event.target.value);
                                  if (end) setDay(barber.id, day.key, true, window.start, end);
                                }}
                              />
                            </label>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
              <CardFooter className="mt-auto bg-secondary/50 p-4">
                <Button type="button" className="w-full" disabled={busy} onClick={() => void saveSchedule(barber)}>
                  Guardar horario
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
