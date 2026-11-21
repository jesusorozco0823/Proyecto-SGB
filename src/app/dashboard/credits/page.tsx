"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, type StatusTone } from '@/components/ui/status-badge';

type Kind = 'owed' | 'prepaid';
type Measure = 'cuts' | 'budget';
type CreditStatus = 'pending_barber' | 'barber_rejected' | 'pending_admin' | 'admin_rejected' | 'active' | 'closed';

type Chargeable = { id: string; service: string; when: string; price: number };

type Credit = {
  id: string;
  clientName: string;
  barberId: string;
  barberName: string;
  kind: Kind;
  note: string | null;
  status: CreditStatus;
  measure: Measure | null;
  limitCuts: number | null;
  limitAmount: number | null;
  usedCuts: number;
  usedAmount: number;
  chargeable: Chargeable[];
};

type Payload = { barbers: { id: string; name: string }[]; requests: Credit[] };

const statusView: Record<CreditStatus, { tone: StatusTone; label: string }> = {
  pending_barber: { tone: 'unconfirmed', label: 'Esperando al barbero' },
  barber_rejected: { tone: 'cancelled', label: 'El barbero no aceptó' },
  pending_admin: { tone: 'deposit_pending', label: 'Esperando al administrador' },
  admin_rejected: { tone: 'cancelled', label: 'El administrador no aprobó' },
  active: { tone: 'going', label: 'Cupo activo' },
  closed: { tone: 'neutral', label: 'Cupo cerrado' },
};

function kindLabel(kind: Kind) {
  return kind === 'prepaid' ? 'Por adelantado' : 'Paga después';
}

function remaining(credit: Credit) {
  if (credit.measure === 'cuts' && credit.limitCuts != null) {
    const left = Math.max(credit.limitCuts - credit.usedCuts, 0);
    return `${left} de ${credit.limitCuts} cortes`;
  }
  if (credit.measure === 'budget' && credit.limitAmount != null) {
    const left = Math.max(credit.limitAmount - credit.usedAmount, 0);
    return `${formatCop(left)} de ${formatCop(credit.limitAmount)}`;
  }
  return '';
}

function fits(credit: Credit, price: number) {
  if (credit.measure === 'cuts' && credit.limitCuts != null) return credit.usedCuts < credit.limitCuts;
  if (credit.measure === 'budget' && credit.limitAmount != null) return credit.usedAmount + price <= credit.limitAmount;
  return false;
}

export default function CreditsPage() {
  const { role } = useAuth();
  const { toast } = useToast();
  const [payload, setPayload] = useState<Payload>({ barbers: [], requests: [] });
  const [barberId, setBarberId] = useState('');
  const [kind, setKind] = useState<Kind>('owed');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, { kind: Kind; measure: Measure; limit: string }>>({});

  const load = async () => {
    const next = await apiClient.get<Payload>('/api/v1/credits');
    setPayload(next);
    setBarberId((current) => current || next.barbers[0]?.id || '');
    setDrafts((current) => {
      const copy = { ...current };
      for (const credit of next.requests) {
        if (!copy[credit.id]) copy[credit.id] = { kind: credit.kind, measure: 'cuts', limit: '' };
      }
      return copy;
    });
  };

  useEffect(() => {
    if (!role) return;
    load().catch((error) => {
      toast({ title: 'No se pudo cargar el crédito', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
    });
  }, [role, toast]);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await action();
      await load();
      toast({ title: success });
    } catch (error) {
      toast({ title: 'No se pudo guardar', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  const title = role === 'client' ? 'Crédito' : role === 'barber' ? 'Crédito de tus clientes' : 'Crédito';
  const description = role === 'client'
    ? 'Se lo pides a tu barbero. Si él dice que sí, el administrador define cuántos cortes o cuánto presupuesto te da.'
    : role === 'barber'
      ? 'Si dices que no, el administrador no ve el pedido. Si dices que sí, él define el cupo.'
      : 'Aquí solo llegan los pedidos que el barbero ya aceptó. Tú defines los cortes o el presupuesto.';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {role === 'client' && (
          <form
            className="space-y-3 rounded-2xl border bg-background p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void run(
                () => apiClient.post('/api/v1/credits', { barberId, kind, note }),
                'Pedido enviado al barbero',
              ).then(() => setNote(''));
            }}
          >
            <p className="text-sm text-muted-foreground">Barbero</p>
            {payload.barbers.length === 0 && <p className="text-sm text-muted-foreground">Cuando tengas una cita con un barbero podrás pedirle crédito.</p>}
            <div className="flex flex-wrap gap-2">
              {payload.barbers.map((barber) => (
                <Button key={barber.id} type="button" variant={barberId === barber.id ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setBarberId(barber.id)}>
                  {barber.name}
                </Button>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">Tipo</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={kind === 'owed' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setKind('owed')}>Pagar después</Button>
              <Button type="button" variant={kind === 'prepaid' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setKind('prepaid')}>Por adelantado</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              {kind === 'prepaid'
                ? 'Pagas el cupo primero y cada corte se descuenta de ahí.'
                : 'El administrador te deja un cupo y pagas cuando lo uses.'}
            </p>
            <Textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={240} placeholder="Una nota corta, si quieres" aria-label="Nota del pedido" />
            <Button type="submit" className="h-10 rounded-full px-4" disabled={busy || !barberId}>Pedir crédito</Button>
          </form>
        )}

        {payload.requests.length === 0 && <p className="py-8 text-center text-muted-foreground">No hay pedidos de crédito.</p>}

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {payload.requests.map((credit) => {
            const draft = drafts[credit.id] ?? { kind: credit.kind, measure: 'cuts' as Measure, limit: '' };
            const left = remaining(credit);
            const state = statusView[credit.status];
            return (
              <article key={credit.id} className="rounded-2xl border bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium break-words">{role === 'client' ? credit.barberName : credit.clientName}</p>
                    {role !== 'client' && role !== 'barber' && <p className="text-sm text-muted-foreground break-words">{credit.barberName}</p>}
                    <p className="text-sm text-muted-foreground">{kindLabel(credit.kind)}{left ? ` · ${left}` : ''}</p>
                    {credit.note && <p className="text-sm break-words">{credit.note}</p>}
                  </div>
                  <StatusBadge tone={state.tone} label={state.label} />
                </div>

                {role === 'barber' && credit.status === 'pending_barber' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" className="h-10 rounded-full px-4" disabled={busy} onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/barber`, { answer: 'accepted' }), 'Aceptaste el pedido')}>Aceptar</Button>
                    <Button type="button" variant="outline" className="h-10 rounded-full px-4" disabled={busy} onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/barber`, { answer: 'rejected' }), 'Le dijiste que no')}>No aceptar</Button>
                  </div>
                )}

                {(role === 'admin' || role === 'superadmin') && credit.status === 'pending_admin' && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant={draft.kind === 'owed' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setDrafts((current) => ({ ...current, [credit.id]: { ...draft, kind: 'owed' } }))}>Pagar después</Button>
                      <Button type="button" variant={draft.kind === 'prepaid' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setDrafts((current) => ({ ...current, [credit.id]: { ...draft, kind: 'prepaid' } }))}>Por adelantado</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant={draft.measure === 'cuts' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setDrafts((current) => ({ ...current, [credit.id]: { ...draft, measure: 'cuts' } }))}>Cortes</Button>
                      <Button type="button" variant={draft.measure === 'budget' ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setDrafts((current) => ({ ...current, [credit.id]: { ...draft, measure: 'budget' } }))}>Presupuesto</Button>
                    </div>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={draft.measure === 'cuts' ? 1 : 1000}
                      step={draft.measure === 'cuts' ? 1 : 1000}
                      aria-label={draft.measure === 'cuts' ? 'Cantidad de cortes' : 'Presupuesto en pesos'}
                      placeholder={draft.measure === 'cuts' ? 'Cantidad de cortes' : 'Presupuesto en pesos'}
                      value={draft.limit}
                      onChange={(event) => setDrafts((current) => ({ ...current, [credit.id]: { ...draft, limit: event.target.value } }))}
                      className="h-10 max-w-xs rounded-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      {draft.kind === 'prepaid'
                        ? 'Al aprobar queda registrado que el cliente ya pagó este cupo.'
                        : 'El cliente usa el cupo y paga después.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        className="h-10 rounded-full px-4"
                        disabled={busy || !draft.limit}
                        onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/decide`, {
                          answer: 'approved',
                          kind: draft.kind,
                          measure: draft.measure,
                          limit: Number(draft.limit),
                        }), 'Cupo aprobado')}
                      >
                        Aprobar cupo
                      </Button>
                      <Button type="button" variant="outline" className="h-10 rounded-full px-4" disabled={busy} onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/decide`, { answer: 'rejected' }), 'No aprobaste el crédito')}>No aprobar</Button>
                    </div>
                  </div>
                )}

                {(role === 'barber' || role === 'admin' || role === 'superadmin') && credit.status === 'active' && credit.chargeable.length > 0 && (
                  <ul className="mt-3 space-y-2 border-t pt-3">
                    {credit.chargeable.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm">{item.service} · {format(new Date(item.when), "d 'de' MMMM, h:mm a", { locale: es })} · {formatCop(item.price)}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="rounded-full"
                          disabled={busy || !fits(credit, item.price)}
                          onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/use`, { appointmentId: item.id }), 'Corte cargado al crédito')}
                        >
                          Cargar
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {(role === 'admin' || role === 'superadmin') && credit.status === 'active' && (
                  <Button type="button" variant="ghost" className="mt-3 h-10 rounded-full px-4" disabled={busy} onClick={() => void run(() => apiClient.post(`/api/v1/credits/${credit.id}/close`), 'Cupo cerrado')}>
                    Cerrar cupo
                  </Button>
                )}
              </article>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
