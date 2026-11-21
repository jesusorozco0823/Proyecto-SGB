"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { formatDisplayTime, parseDisplayTime } from '@/server/shared/time/schedule-time';
import { chainSpecialStarts } from '@/server/modules/barbers/domain/turn-planner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StepWizard } from '@/components/ui/step-wizard';
import { Modal } from '@/components/ui/modal';
import { Check, Clock, Hash, Scissors, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCop } from '@/lib/money';

type Offering = {
  id: string;
  name: string;
  durationMinutes: number;
  description: string | null;
  isSpecial: boolean;
  price: number;
};

type Preview = {
  needsCounts: boolean;
  needsSpecialTime: boolean;
  suggestions: string[];
  remainderMinutes: number;
  groups: { durationMinutes: number; kind: 'pool' | 'dedicated'; names: string[]; maxCount: number }[];
  extra: { extensionMinutes: number; departure: string; start: string; end: string } | null;
  turns: { start: string; end: string; serviceId: string | null; isExtra: boolean }[];
  effectiveClose: string;
};

type StepId = 'jornada' | 'servicios' | 'cantidades' | 'especiales' | 'revisar';

const DAYS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
  { id: 6, label: 'Sábado' },
  { id: 0, label: 'Domingo' },
];

function clockOptions(fromMin: number, toMin: number) {
  const options: string[] = [];
  for (let minute = fromMin; minute <= toMin; minute += 5) options.push(formatDisplayTime(minute));
  return options;
}

export default function SchedulePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [lunchMinutes, setLunchMinutes] = useState(60);
  const [scope, setScope] = useState<'week' | 'day'>('week');
  const [weekday, setWeekday] = useState(1);
  const [open, setOpen] = useState('08:00 AM');
  const [close, setClose] = useState('05:00 PM');
  const [lunchStart, setLunchStart] = useState('12:00 PM');
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [specialStart, setSpecialStart] = useState('');
  const [specialTimes, setSpecialTimes] = useState<Record<string, string>>({});
  const [specialTouched, setSpecialTouched] = useState<Record<string, boolean>>({});
  const [extraServiceId, setExtraServiceId] = useState('');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('25');
  const [price, setPrice] = useState('20000');
  const [dayOffOpen, setDayOffOpen] = useState(false);
  const [dayOff, setDayOff] = useState('');
  const [dayOffReason, setDayOffReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSpecial, setIsSpecial] = useState(false);
  const [saving, setSaving] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [weekLoaded, setWeekLoaded] = useState<boolean | null>(null);

  const hours = useMemo(() => clockOptions(7 * 60, 21 * 60), []);
  const lunchOptions = useMemo(() => {
    const latest = 14 * 60 - lunchMinutes;
    return clockOptions(11 * 60, Math.max(11 * 60, latest));
  }, [lunchMinutes]);

  const loadOfferings = () => {
    apiClient.get<Offering[]>('/api/v1/barbers/me/services').then(setOfferings).catch(() => setOfferings([]));
  };

  useEffect(() => {
    loadOfferings();
    apiClient.get<{ durationMinutes: number }>('/api/v1/lunch-policy').then((policy) => setLunchMinutes(policy.durationMinutes)).catch(() => setLunchMinutes(60));
    apiClient.get<{ weekLoaded: boolean }>('/api/v1/barbers/me/open-days').then((board) => setWeekLoaded(board.weekLoaded)).catch(() => setWeekLoaded(false));
  }, []);

  const chosen = offerings.filter((item) => selected.includes(item.id));
  const durationCount = new Map<number, number>();
  for (const item of chosen) durationCount.set(item.durationMinutes, (durationCount.get(item.durationMinutes) ?? 0) + 1);
  const dedicated = chosen.filter((item) => durationCount.get(item.durationMinutes) === 1);
  const needsCounts = new Set(chosen.map((item) => item.durationMinutes)).size > 1;
  const specials = dedicated.filter((item) => item.isSpecial && Number(counts[item.id] ?? (needsCounts ? '0' : '1')) > 0);

  const chainResult = useMemo(() => {
    if (!specialStart || specials.length === 0) return { turns: [], note: '' };
    try {
      return {
        turns: chainSpecialStarts({
          openMin: parseDisplayTime(open),
          closeMin: parseDisplayTime(close),
          lunchStartMin: parseDisplayTime(lunchStart),
          lunchDuration: lunchMinutes,
          specials: specials.map((item) => ({
            id: item.id,
            name: item.name,
            durationMinutes: item.durationMinutes,
            count: needsCounts ? Number(counts[item.id] || 0) : null,
          })),
          firstStartMin: parseDisplayTime(specialStart),
          overrides: specials.slice(1).flatMap((item) => {
            if (!specialTouched[item.id] || !specialTimes[item.id]) return [];
            return [{ serviceId: item.id, startMin: parseDisplayTime(specialTimes[item.id]) }];
          }),
        }),
        note: '',
      };
    } catch (error) {
      return { turns: [], note: error instanceof Error ? error.message : 'Esa hora no deja espacio para el siguiente servicio especial.' };
    }
  }, [specialStart, specials, open, close, lunchStart, lunchMinutes, needsCounts, counts, specialTouched, specialTimes]);
  const chain = chainResult.turns;
  const chainNote = chainResult.note;

  const steps = useMemo(() => {
    const list: { id: StepId; title: string; detail: string }[] = [
      { id: 'jornada', title: 'Jornada', detail: 'Elige si cargas la semana o un día, y las horas.' },
      { id: 'servicios', title: 'Servicios', detail: 'Marca los servicios de ese horario.' },
    ];
    if (needsCounts) list.push({ id: 'cantidades', title: 'Cantidades', detail: 'Indica cuántos turnos quieres de cada duración.' });
    if (specials.length > 0) list.push({ id: 'especiales', title: 'Especiales', detail: 'Elige la hora del primero. Los demás quedan después.' });
    list.push({ id: 'revisar', title: 'Revisar', detail: 'Confirma los turnos antes de guardarlos.' });
    return list;
  }, [needsCounts, specials.length]);

  useEffect(() => {
    setStepIndex((current) => Math.min(current, Math.max(steps.length - 1, 0)));
  }, [steps.length]);

  const step = steps[stepIndex] ?? steps[0];

  const specialStarts = () => {
    const firstOf = new Map<string, number>();
    for (const turn of chain) {
      if (!firstOf.has(turn.serviceId)) firstOf.set(turn.serviceId, turn.startMin);
    }
    return [...firstOf.entries()].map(([serviceId, startMin]) => ({ serviceId, start: formatDisplayTime(startMin) }));
  };

  const payload = () => ({
    open,
    close,
    lunchStart,
    serviceIds: selected,
    counts: needsCounts
      ? dedicated.filter((item) => counts[item.id] !== undefined && counts[item.id] !== '').map((item) => ({ serviceId: item.id, count: Number(counts[item.id]) }))
      : [],
    ...(specialStart ? { specialStart } : {}),
    ...(chain.length > 0 ? { specialStarts: specialStarts() } : {}),
    ...(extraServiceId ? { extraServiceId } : {}),
  });

  const runPreview = async (withExtra = extraServiceId) => {
    const body = { ...payload(), ...(withExtra ? { extraServiceId: withExtra } : {}) };
    if (!withExtra) delete (body as { extraServiceId?: string }).extraServiceId;
    const result = await apiClient.post<Preview>('/api/v1/barbers/me/schedule/preview', body);
    setPreview(result);
    return result;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await apiClient.put<{ effectiveClose: string; turns: number }>('/api/v1/barbers/me/schedule', {
        ...payload(),
        weekdays: scope === 'week' ? [1, 2, 3, 4, 5, 6] : [weekday],
      });
      toast({ title: 'Agenda guardada', description: `${result.turns} turnos. Salida a las ${result.effectiveClose}.` });
      router.push('/dashboard');
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : 'Revisa los datos.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateService = async () => {
    try {
      const created = await apiClient.post<Offering>('/api/v1/barbers/me/services', {
        name,
        durationMinutes: Number(duration),
        price: Number(price),
        description: description || undefined,
        isSpecial,
      });
      setName('');
      setDescription('');
      setIsSpecial(false);
      setSelected((current) => [...current, created.id]);
      loadOfferings();
    } catch (error) {
      toast({ title: 'No se pudo crear el servicio', description: error instanceof Error ? error.message : 'Revisa los datos.', variant: 'destructive' });
    }
  };

  const countsReady = dedicated.every((item) => counts[item.id] !== undefined && counts[item.id] !== '' && Number(counts[item.id]) >= 0);
  const canContinue = step.id === 'servicios' ? selected.length > 0 : step.id === 'cantidades' ? countsReady : step.id === 'especiales' ? Boolean(specialStart) && chain.length > 0 : true;

  const goNext = async () => {
    const next = steps[stepIndex + 1];
    if (next?.id === 'revisar') {
      try {
        await runPreview();
      } catch (error) {
        toast({ title: 'No se pudo armar la agenda', description: error instanceof Error ? error.message : 'Revisa los datos.', variant: 'destructive' });
        return;
      }
    }
    setStepIndex((current) => Math.min(current + 1, steps.length - 1));
  };

  const serviceName = (id: string | null) => offerings.find((item) => item.id === id)?.name ?? 'El cliente elige';
  const suggestedStart = (serviceId: string) => {
    const startMin = chain.find((turn) => turn.serviceId === serviceId)?.startMin;
    return startMin == null ? '' : formatDisplayTime(startMin);
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-headline sm:text-3xl">Mi horario</h1>
          {weekLoaded === null ? (
            <p className="text-sm text-muted-foreground">Cargando horario…</p>
          ) : weekLoaded ? (
            <p className="text-sm text-muted-foreground">La semana ya está cargada. Los cambios se hacen en el día que necesites.</p>
          ) : (
            <p className="text-sm text-muted-foreground">El almuerzo dura {lunchMinutes} minutos y debe caer entre las 11:00 a. m. y las 2:00 p. m.</p>
          )}
        </div>
        <Button type="button" variant="outline" onClick={() => setDayOffOpen(true)}>Marcar un día libre</Button>
      </div>

      <Modal
        open={dayOffOpen}
        onOpenChange={setDayOffOpen}
        title="Día libre"
        description="Los turnos ya reservados se conservan. Los turnos libres de ese día se retiran."
        footer={(
          <>
            <Button variant="outline" onClick={() => setDayOffOpen(false)}>Cancelar</Button>
            <Button onClick={() => apiClient.post('/api/v1/barbers/me/day-off', { date: dayOff, reason: dayOffReason }).then(() => { toast({ title: 'Día libre guardado' }); setDayOffOpen(false); }).catch((error) => toast({ title: 'No se pudo guardar el día libre', description: error instanceof Error ? error.message : 'Revisa la fecha.', variant: 'destructive' }))}>Guardar día libre</Button>
          </>
        )}
      >
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Fecha</Label>
            <Input type="date" value={dayOff} onChange={(event) => setDayOff(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Motivo</Label>
            <Input value={dayOffReason} onChange={(event) => setDayOffReason(event.target.value)} placeholder="Motivo" />
          </div>
        </div>
      </Modal>

      {weekLoaded && (
        <Card>
          <CardHeader>
            <CardTitle>La semana ya está cargada</CardTitle>
            <CardDescription>El formulario de horario queda cerrado. Para un día en particular, quita un turno libre o agrega uno nuevo.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full"><Link href="/dashboard/turns">Ver turnos disponibles</Link></Button>
          </CardContent>
        </Card>
      )}

      {weekLoaded === false && (
      <StepWizard
        steps={steps.map((item) => ({ id: item.id, title: item.title, icon: item.id === 'jornada' ? Clock : item.id === 'servicios' ? Scissors : item.id === 'cantidades' ? Hash : item.id === 'especiales' ? Sparkles : Check }))}
        current={stepIndex}
        heading={step.title}
        description={step.detail}
        onBack={() => setStepIndex((current) => Math.max(current - 1, 0))}
        onNext={step.id === 'revisar' ? handleSave : goNext}
        nextLabel={step.id === 'revisar' ? 'Guardar agenda' : 'Siguiente'}
        nextDisabled={step.id === 'revisar' ? saving || !preview || preview.turns.length === 0 || preview.needsSpecialTime || (preview.remainderMinutes > 0 && !preview.extra) : !canContinue}
        busy={saving}
      >
        <div className="space-y-4">
          {step.id === 'jornada' && (
            <>
              <div className="space-y-2">
                <Label>Alcance</Label>
                <Select value={scope} onValueChange={(value: 'week' | 'day') => setScope(value)}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Toda la semana (lunes a sábado)</SelectItem>
                    <SelectItem value="day">Un solo día</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {scope === 'day' && (
                <div className="space-y-2">
                  <Label>Día</Label>
                  <Select value={String(weekday)} onValueChange={(value) => setWeekday(Number(value))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => <SelectItem key={day.id} value={String(day.id)}>{day.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Apertura</Label>
                <Select value={open} onValueChange={setOpen}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{hours.map((hour) => <SelectItem key={hour} value={hour}>{hour}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>Cierre</Label>
                <Select value={close} onValueChange={setClose}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{hours.map((hour) => <SelectItem key={`c-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-2">
                <Label>Inicio del almuerzo</Label>
                <Select value={lunchStart} onValueChange={setLunchStart}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{lunchOptions.map((hour) => <SelectItem key={`l-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent></Select>
              </div>
            </>
          )}

          {step.id === 'servicios' && (
            <>
              {offerings.length === 0 && <p className="text-sm text-muted-foreground">Todavía no tienes servicios. Agrega el primero abajo.</p>}
              {offerings.map((offering) => (
                <label key={offering.id} className="flex min-h-12 items-start gap-3 rounded-lg border p-3">
                  <Checkbox className="mt-1" checked={selected.includes(offering.id)} onCheckedChange={() => setSelected((current) => current.includes(offering.id) ? current.filter((id) => id !== offering.id) : [...current, offering.id])} />
                  <span className="min-w-0">
                    <span className="block font-medium break-words">{offering.name}</span>
                    <span className="block text-sm text-muted-foreground">{formatCop(offering.price)} · {offering.durationMinutes} min{offering.isSpecial ? ' · servicio especial' : ''}{offering.description ? ` · ${offering.description}` : ''}</span>
                  </span>
                </label>
              ))}
              <div className="space-y-3 rounded-lg border p-4">
                <p className="font-medium">Nuevo servicio</p>
                <div className="space-y-2"><Label>Nombre</Label><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Corte clásico" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Minutos</Label><Input type="number" min={1} value={duration} onChange={(event) => setDuration(event.target.value)} /></div>
                  <div className="space-y-2"><Label>Precio</Label><Input type="number" min={0} value={price} onChange={(event) => setPrice(event.target.value)} /></div>
                </div>
                <div className="space-y-2"><Label>Descripción</Label><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="El cliente la verá al reservar" /></div>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={isSpecial} onCheckedChange={(value) => setIsSpecial(value === true)} />Es un servicio especial</label>
                <Button type="button" className="w-full" variant="secondary" onClick={handleCreateService}>Agregar servicio</Button>
              </div>
            </>
          )}

          {step.id === 'cantidades' && dedicated.map((offering) => (
            <div key={offering.id} className="space-y-2">
              <Label>Turnos de {offering.name}</Label>
              <p className="text-sm text-muted-foreground">{offering.durationMinutes} minutos cada uno.</p>
              <Input className="h-11" type="number" min={0} inputMode="numeric" value={counts[offering.id] ?? ''} onChange={(event) => setCounts((current) => ({ ...current, [offering.id]: event.target.value }))} />
            </div>
          ))}

          {step.id === 'especiales' && (
            <>
              {specials.map((offering, index) => {
                const value = index === 0 ? specialStart : (specialTouched[offering.id] ? specialTimes[offering.id] ?? '' : suggestedStart(offering.id));
                const extraCount = Math.max(0, Number(counts[offering.id] ?? (needsCounts ? '0' : '1')) - 1);
                return (
                  <div key={offering.id} className="space-y-2">
                    <Label>{index === 0 ? `Hora de ${offering.name}` : `${offering.name} empieza después`}</Label>
                    {index > 0 && <p className="text-sm text-muted-foreground">Por defecto queda a continuación del especial anterior. Puedes cambiarla.</p>}
                    <Select
                      value={value || undefined}
                      onValueChange={(next) => {
                        if (index === 0) {
                          setSpecialStart(next);
                          return;
                        }
                        setSpecialTouched((current) => ({ ...current, [offering.id]: true }));
                        setSpecialTimes((current) => ({ ...current, [offering.id]: next }));
                      }}
                    >
                      <SelectTrigger className="h-11"><SelectValue placeholder="Elige la hora" /></SelectTrigger>
                      <SelectContent>{(value && !hours.includes(value) ? [value, ...hours] : hours).map((hour) => <SelectItem key={`${offering.id}-${hour}`} value={hour}>{hour}</SelectItem>)}</SelectContent>
                    </Select>
                    {!needsCounts && index === 0 && value && <p className="text-sm text-muted-foreground">Los demás turnos de {offering.name} quedan después de esta hora.</p>}
                    {needsCounts && extraCount > 0 && value && <p className="text-sm text-muted-foreground">{extraCount === 1 ? 'El otro turno' : `Los otros ${extraCount} turnos`} de {offering.name} {extraCount === 1 ? 'queda' : 'quedan'} a continuación de esta hora.</p>}
                  </div>
                );
              })}
              {chainNote && <p className="text-sm text-destructive">{chainNote}</p>}
            </>
          )}

          {step.id === 'revisar' && preview && (
            <div className="space-y-3">
              {preview.suggestions.map((line) => <p key={line} className="text-sm text-muted-foreground">{line}</p>)}
              {preview.turns.length === 0 && preview.needsCounts && <p className="text-sm">Falta indicar la cantidad de cada duración distinta.</p>}
              {preview.needsSpecialTime && <p className="text-sm">Falta la hora del servicio especial.</p>}
              <ul className="space-y-2">
                {preview.turns.map((turn, index) => (
                  <li key={`${turn.start}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                    <span>{turn.start} – {turn.end}</span>
                    <span className="text-muted-foreground">{turn.isExtra ? 'Turno extra · ' : ''}{serviceName(turn.serviceId)}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm">Salida prevista: {preview.effectiveClose}</p>
              {preview.remainderMinutes > 0 && (
                <div className="space-y-2">
                  <Label>Quedan {preview.remainderMinutes} minutos al cierre. ¿Qué servicio va en el turno extra?</Label>
                  <Select value={extraServiceId} onValueChange={async (value) => { setExtraServiceId(value); try { await runPreview(value); } catch (error) { toast({ title: 'No se pudo calcular el turno extra', description: error instanceof Error ? error.message : 'Revisa el servicio.', variant: 'destructive' }); } }}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Elige el servicio" /></SelectTrigger>
                    <SelectContent>{chosen.map((item) => <SelectItem key={item.id} value={item.id}>{item.name} ({item.durationMinutes} min)</SelectItem>)}</SelectContent>
                  </Select>
                  {preview.extra && <p className="text-sm">El turno va de {preview.extra.start} a {preview.extra.end}. La salida queda a las {preview.extra.departure}.</p>}
                </div>
              )}
            </div>
          )}
          {step.id === 'revisar' && !preview && <p className="text-sm text-muted-foreground">Todavía no hay una vista previa.</p>}
        </div>
      </StepWizard>
      )}
    </div>
  );
}
