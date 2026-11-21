"use client";

import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDisplayTime, parseDisplayTime } from '@/server/shared/time/schedule-time';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Modal } from '@/components/ui/modal';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type DayBoard = {
  date: string;
  label: string;
  closed: boolean;
  open: string;
  close: string;
  lunchStart: string;
  lunchEnd: string;
  occupied: { start: string; end: string }[];
  turns: { id: string; start: string; end: string; name: string; isExtra: boolean }[];
};

type Board = {
  weekLoaded: boolean;
  services: { id: string; name: string; durationMinutes: number }[];
  days: DayBoard[];
};

function clockOptions(fromMin: number, toMin: number) {
  const options: string[] = [];
  for (let minute = fromMin; minute <= toMin; minute += 5) options.push(formatDisplayTime(minute));
  return options;
}

function isOutsideSchedule(label: string, duration: number, closeLabel: string) {
  return parseDisplayTime(label) + duration > parseDisplayTime(closeLabel);
}

function freeHours(candidates: string[], duration: number, busy: { start: string; end: string }[]) {
  const blocks = busy.map((slot) => ({ start: parseDisplayTime(slot.start), end: parseDisplayTime(slot.end) }));
  return candidates.filter((label) => {
    const startMin = parseDisplayTime(label);
    const endMin = startMin + duration;
    return blocks.every((slot) => endMin <= slot.start || startMin >= slot.end);
  });
}

function shortDay(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day));
}

export default function TurnsPage() {
  const { toast } = useToast();
  const [board, setBoard] = useState<Board | null>(null);
  const [date, setDate] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [start, setStart] = useState('');
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = () => {
    apiClient.get<Board>('/api/v1/barbers/me/open-days').then((result) => {
      setBoard(result);
      setDate((current) => (current && result.days.some((day) => day.date === current) ? current : result.days.find((day) => !day.closed)?.date || result.days[0]?.date || ''));
    }).catch(() => setBoard({ weekLoaded: false, services: [], days: [] }));
  };

  useEffect(() => {
    load();
  }, []);

  const selectedDay = board?.days.find((day) => day.date === date);
  const duration = board?.services.find((service) => service.id === serviceId)?.durationMinutes ?? 0;
  const closeMin = selectedDay ? parseDisplayTime(selectedDay.close) : 0;
  const afternoonEnd = selectedDay ? Math.max(22 * 60, closeMin + 3 * 60) : 0;
  const hours = selectedDay && duration > 0
    ? freeHours([
        ...clockOptions(parseDisplayTime(selectedDay.open), parseDisplayTime(selectedDay.lunchStart) - duration),
        ...clockOptions(parseDisplayTime(selectedDay.lunchEnd), afternoonEnd - duration),
      ], duration, selectedDay.occupied ?? [])
    : [];
  const chosenStart = hours.includes(start) ? start : '';
  const chosenIsExtra = Boolean(selectedDay && chosenStart && isOutsideSchedule(chosenStart, duration, selectedDay.close));

  const addTurn = async () => {
    setSaving(true);
    try {
      await apiClient.post('/api/v1/barbers/me/turns', { date, start: chosenStart, serviceId });
      toast({ title: 'Turno agregado' });
      setStart('');
      setAddOpen(false);
      load();
    } catch (error) {
      toast({ title: 'No se pudo agregar el turno', description: error instanceof Error ? error.message : 'Revisa la hora.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const removeTurn = async () => {
    if (!pendingId) return;
    try {
      await apiClient.delete(`/api/v1/barbers/me/turns/${pendingId}`);
      toast({ title: 'Turno quitado' });
      setPendingId(null);
      load();
    } catch (error) {
      toast({ title: 'No se pudo quitar el turno', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold font-headline sm:text-3xl">Turnos disponibles</h1>
          <p className="text-sm text-muted-foreground">Los turnos que todavía nadie reservó, día por día.</p>
        </div>
        {board && board.days.some((day) => !day.closed) && (
          <Button className="h-11" onClick={() => setAddOpen(true)} disabled={!selectedDay || selectedDay.closed}>
            <Plus className="h-4 w-4" />
            Agregar turno
          </Button>
        )}
      </div>

      {!board && <p className="text-sm text-muted-foreground">Cargando turnos…</p>}
      {board && board.days.length === 0 && <p className="text-sm text-muted-foreground">Todavía no hay un horario cargado.</p>}

      {board && board.days.length > 0 && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {board.days.map((day) => (
              <button
                key={day.date}
                type="button"
                onClick={() => { setDate(day.date); setStart(''); }}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-2 text-sm capitalize',
                  day.date === date ? 'border-primary bg-primary text-primary-foreground' : 'bg-card text-muted-foreground hover:text-foreground',
                )}
              >
                {shortDay(day.date)} · {day.closed ? 'cerrado' : `${day.turns.length} libres`}
              </button>
            ))}
          </div>

          {selectedDay?.closed && <p className="text-sm text-muted-foreground">Este día está cerrado.</p>}
          {selectedDay && !selectedDay.closed && selectedDay.turns.length === 0 && <p className="text-sm text-muted-foreground">No quedan turnos libres.</p>}
          {selectedDay && !selectedDay.closed && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {selectedDay.turns.map((turn) => (
                <article key={turn.id} className="flex items-center justify-between gap-3 rounded-2xl border bg-card p-4">
                  <div className="min-w-0 space-y-2">
                    <p className="flex items-center gap-2 font-medium"><Clock className="h-4 w-4 text-primary" />{turn.start} – {turn.end}</p>
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone="service" label={turn.name} />
                      {turn.isExtra && <StatusBadge tone="extra" />}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="shrink-0 text-destructive" onClick={() => setPendingId(turn.id)}>
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </Button>
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <Modal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Agregar un turno"
        description="Solo afecta el día elegido. No puede cruzar el almuerzo. Después del cierre sigue habiendo horas, y esas cuentan como tiempo extra."
        footer={(
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancelar</Button>
            <Button onClick={addTurn} disabled={saving || !date || !serviceId || !chosenStart}>Agregar turno</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Día</Label>
            <Select value={date} onValueChange={(value) => { setDate(value); setStart(''); }}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Elige el día" /></SelectTrigger>
              <SelectContent>
                {board?.days.filter((day) => !day.closed).map((day) => <SelectItem key={day.date} value={day.date}>{day.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Servicio</Label>
            <Select value={serviceId} onValueChange={(value) => { setServiceId(value); setStart(''); }}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Elige el servicio" /></SelectTrigger>
              <SelectContent>
                {board?.services.map((service) => <SelectItem key={service.id} value={service.id}>{service.name} · {service.durationMinutes} min</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Hora</Label>
            <Select value={chosenStart} onValueChange={setStart} disabled={!serviceId || hours.length === 0}>
              <SelectTrigger className="h-11"><SelectValue placeholder={serviceId ? 'Elige una hora libre' : 'Elige primero el servicio'} /></SelectTrigger>
              <SelectContent>
                {hours.map((hour) => (
                  <SelectItem key={hour} value={hour}>
                    {hour}{selectedDay && isOutsideSchedule(hour, duration, selectedDay.close) ? ' · tiempo extra' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {serviceId && hours.length === 0 && <p className="text-sm text-muted-foreground">No queda un hueco de {duration} minutos que no cruce un turno ya creado.</p>}
            {chosenIsExtra && selectedDay && (
              <p className="rounded-xl border border-accent bg-accent px-3 py-2 text-sm text-accent-foreground">
                Este turno queda fuera del horario establecido ({selectedDay.open} – {selectedDay.close}). Cuenta como tiempo extra.
              </p>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={pendingId !== null}
        onOpenChange={(open) => { if (!open) setPendingId(null); }}
        title="Quitar este turno"
        description="El turno deja de estar disponible. Si ya tiene una cita, no se puede quitar."
        footer={(
          <>
            <Button variant="outline" onClick={() => setPendingId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={removeTurn}>Quitar turno</Button>
          </>
        )}
      />
    </div>
  );
}
