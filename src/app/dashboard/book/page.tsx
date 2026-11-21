"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Barber } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Check, User, Scissors, Calendar as CalendarIcon, type LucideIcon } from 'lucide-react';
import { StepWizard } from '@/components/ui/step-wizard';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { formatCop } from '@/lib/money';
import { format } from 'date-fns';

type Offering = { id: string; name: string; durationMinutes: number; price: number; description: string | null; isSpecial: boolean };
type Turn = { id: string; start: string; end: string; isExtra: boolean };
type TurnResponse = { turns: Turn[]; closed?: boolean; depositAmount?: number };
type BookingStep = 'barber' | 'service' | 'datetime' | 'confirm';

type LastVisit = { barberId: string; serviceId: string; barberName: string; serviceName: string };

function BookingPage() {
  const params = useSearchParams();
  const appliedLink = useRef(false);
  const [step, setStep] = useState<BookingStep>('barber');
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [closedDay, setClosedDay] = useState(false);
  const [depositAmount, setDepositAmount] = useState(0);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTurn, setSelectedTurn] = useState<Turn | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastVisit, setLastVisit] = useState<LastVisit | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (appliedLink.current) return;
    const barber = params.get('barber');
    const service = params.get('service');
    if (!barber || !service) return;
    appliedLink.current = true;
    setSelectedBarber(barber);
    setSelectedService(service);
    const date = params.get('date');
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-').map(Number);
      setSelectedDate(new Date(year, month - 1, day));
    }
    setStep('datetime');
  }, [params]);

  useEffect(() => {
    apiClient.get<Array<{ datetime: string; status: string; barberId: string; serviceIds: string[]; barber?: { name: string }; services?: { id: string; name: string }[] }>>('/api/v1/appointments')
      .then((rows) => {
        const last = rows
          .filter((row) => row.status !== 'cancelled' && row.barberId && (row.services?.[0]?.id || row.serviceIds[0]))
          .sort((left, right) => right.datetime.localeCompare(left.datetime))[0];
        if (!last) {
          setLastVisit(null);
          return;
        }
        setLastVisit({
          barberId: last.barberId,
          serviceId: last.services?.[0]?.id ?? last.serviceIds[0],
          barberName: last.barber?.name ?? 'Tu barbero',
          serviceName: last.services?.[0]?.name ?? 'tu servicio',
        });
      })
      .catch(() => setLastVisit(null));
  }, []);

  useEffect(() => {
    apiClient.get<Barber[]>('/api/v1/barbers').then(setBarbers).catch(() => setBarbers([]));
  }, []);

  useEffect(() => {
    if (!selectedBarber) {
      setOfferings([]);
      return;
    }
    apiClient.get<Offering[]>(`/api/v1/barbers/${selectedBarber}/services`).then(setOfferings).catch(() => setOfferings([]));
  }, [selectedBarber]);

  useEffect(() => {
    if (!selectedBarber || !selectedService || !selectedDate) {
      setTurns([]);
      return;
    }
    const date = format(selectedDate, 'yyyy-MM-dd');
    apiClient
      .get<TurnResponse>(`/api/v1/barbers/${selectedBarber}/turns?date=${date}&serviceId=${selectedService}`)
      .then((result) => {
        setTurns(Array.isArray(result.turns) ? result.turns : []);
        setClosedDay(Boolean(result.closed));
        setDepositAmount(result.depositAmount ?? 0);
      })
      .catch(() => setTurns([]));
  }, [selectedBarber, selectedService, selectedDate]);

  const handleBooking = async () => {
    if (!selectedBarber || !selectedService || !selectedTurn) return;
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/appointments', {
        barberId: selectedBarber,
        barberServiceId: selectedService,
        dayTurnId: selectedTurn.id,
      });
      toast({ title: 'Cita reservada', description: 'Tu turno quedó confirmado.' });
      setStep('barber');
      setSelectedBarber(null);
      setSelectedService(null);
      setSelectedTurn(null);
    } catch (error) {
      toast({ title: 'No se pudo reservar', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const chosen = offerings.find((item) => item.id === selectedService);
  const barber = barbers.find((item) => item.id === selectedBarber);
  const steps: { id: BookingStep; title: string; icon: LucideIcon }[] = [
    { id: 'barber', title: 'Barbero', icon: User },
    { id: 'service', title: 'Servicio', icon: Scissors },
    { id: 'datetime', title: 'Turno', icon: CalendarIcon },
    { id: 'confirm', title: 'Confirmar', icon: Check },
  ];
  const currentStepIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reservar una cita</h1>
        <p className="text-muted-foreground">Elige un barbero, un servicio y uno de sus turnos.</p>
      </div>
      {lastVisit && step === 'barber' && (
        <Button
          variant="secondary"
          onClick={() => {
            setSelectedBarber(lastVisit.barberId);
            setSelectedService(lastVisit.serviceId);
            setSelectedTurn(null);
            setStep('datetime');
          }}
        >
          Igual que la última vez · {lastVisit.barberName} · {lastVisit.serviceName}
        </Button>
      )}
      <StepWizard
        steps={steps}
        current={currentStepIndex}
        heading={steps[currentStepIndex].title}
        description={
          step === 'barber' ? 'Elige el barbero.'
          : step === 'service' ? 'Elige un solo servicio. Verás únicamente los turnos de esa duración.'
          : step === 'datetime' ? 'Elige el día y uno de los turnos disponibles.'
          : 'Revisa la reserva antes de confirmar.'
        }
        onBack={() => setStep(steps[currentStepIndex - 1].id)}
        onNext={step === 'confirm' ? handleBooking : () => setStep(steps[currentStepIndex + 1].id)}
        nextLabel={step === 'confirm' ? 'Confirmar reserva' : 'Siguiente'}
        nextDisabled={(step === 'barber' && !selectedBarber) || (step === 'service' && !selectedService) || (step === 'datetime' && !selectedTurn)}
        busy={isLoading}
      >
          {step === 'barber' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {barbers.map((item) => (
                <button key={item.id} onClick={() => { setSelectedBarber(item.id); setSelectedService(null); setSelectedTurn(null); }} className={cn('rounded-lg border p-4 text-left hover:border-primary', selectedBarber === item.id && 'border-primary ring-2 ring-primary')}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16"><AvatarImage src={item.imageUrl} /><AvatarFallback>{item.name.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.skills.slice(0, 2).join(', ')}</p>
                    </div>
                    {selectedBarber === item.id && <Check className="ml-auto text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          )}
          {step === 'service' && (
            <div className="space-y-3">
              {offerings.length === 0 && <p className="text-muted-foreground">Este barbero todavía no publicó servicios.</p>}
              {offerings.map((item) => (
                <button key={item.id} onClick={() => { setSelectedService(item.id); setSelectedTurn(null); }} className={cn('flex w-full items-start justify-between rounded-lg border p-4 text-left hover:border-primary', selectedService === item.id && 'border-primary ring-2 ring-primary')}>
                  <span>
                    <span className="block font-semibold">{item.name}</span>
                    <span className="block text-sm text-muted-foreground">{item.description || (item.isSpecial ? 'Servicio especial' : 'Servicio del barbero')}</span>
                  </span>
                  <span className="text-right text-sm text-muted-foreground">{formatCop(item.price)} · {item.durationMinutes} min</span>
                </button>
              ))}
            </div>
          )}
          {step === 'datetime' && (
            <div className="grid gap-8 md:grid-cols-2">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => { setSelectedDate(date); setSelectedTurn(null); }} className="self-start rounded-md border" disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} />
              <div className="grid grid-cols-2 gap-2 self-start">
                {turns.map((turn) => (
                  <Button key={turn.id} variant={selectedTurn?.id === turn.id ? 'default' : 'outline'} onClick={() => setSelectedTurn(turn)}>
                    {turn.start}{turn.isExtra ? ' · extra' : ''}
                  </Button>
                ))}
                {depositAmount > 0 && <p className="col-span-2 text-sm text-muted-foreground">Esta reserva pide un abono de {formatCop(depositAmount)} para apartar la cita. El salón lo confirma.</p>}
                {turns.length === 0 && <p className="col-span-2 text-muted-foreground">{closedDay ? 'Este día está cerrado.' : 'No hay turnos de este servicio en el día elegido.'}</p>}
                {turns.length === 0 && selectedBarber && selectedService && selectedDate && (
                  <Button variant="secondary" className="col-span-2" onClick={() => apiClient.post('/api/v1/waitlist', { barberId: selectedBarber, serviceId: selectedService, date: format(selectedDate, 'yyyy-MM-dd') }).then(() => toast({ title: 'Te avisaremos', description: 'Quedaste en la lista de espera de este día.' })).catch((error) => toast({ title: 'No se pudo anotar la espera', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Avisarme si se libera</Button>
                )}
              </div>
            </div>
          )}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4"><h3 className="mb-2 font-semibold">Barbero</h3><p className="text-muted-foreground">{barber?.name}</p></div>
              <div className="rounded-lg border p-4"><h3 className="mb-2 font-semibold">Servicio</h3><p className="text-muted-foreground">{chosen?.name} · {chosen ? formatCop(chosen.price) : ''} · {chosen?.durationMinutes} min</p></div>
              <div className="rounded-lg border p-4"><h3 className="mb-2 font-semibold">Turno</h3><p className="text-muted-foreground">{selectedDate?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })} · {selectedTurn?.start} a {selectedTurn?.end}</p></div>
            </div>
          )}
      </StepWizard>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Cargando reserva…</p>}>
      <BookingPage />
    </Suspense>
  );
}
