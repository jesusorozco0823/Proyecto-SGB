"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DollarSign, Scissors } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type MonthCut = {
  completedServices: number;
  serviceTotal: number;
  commission: number;
  commissionPercent: number;
  services: { name: string; count: number; total: number }[];
  cuts: { id: string; when: string; client: string; service: string; price: number }[];
};

function money(value: number) {
  return formatCop(value);
}

function monthRange() {
  const today = new Date();
  const from = new Date(today.getFullYear(), today.getMonth(), 1);
  const stamp = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { from: stamp(from), to: stamp(today), label: format(from, 'MMMM yyyy', { locale: es }) };
}

export default function MonthPage() {
  const [report, setReport] = useState<MonthCut | null>(null);
  const [error, setError] = useState('');
  const range = monthRange();

  useEffect(() => {
    apiClient.get<MonthCut>(`/api/v1/cash-cut?from=${range.from}&to=${range.to}`)
      .then(setReport)
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'No se pudo cargar el mes.'));
  }, [range.from, range.to]);

  const cards = [
    { title: 'Plata del mes', value: report ? money(report.serviceTotal) : '—', icon: DollarSign },
    { title: 'Tu comisión', value: report ? money(report.commission) : '—', icon: DollarSign },
    { title: 'Recortes', value: report?.completedServices ?? '—', icon: Scissors },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Recortes de {range.label}</h1>
        <p className="text-muted-foreground">Lo que ya completaste este mes, en plata y por servicio.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
                <card.icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              {card.title === 'Tu comisión' && report && (
                <p className="text-xs text-muted-foreground">{report.commissionPercent}% de la plata del mes</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Por servicio</h2>
        {report && report.services.length === 0 && (
          <p className="text-sm text-muted-foreground">Este mes todavía no tienes recortes completados.</p>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(report?.services ?? []).map((service) => (
            <article key={service.name} className="rounded-2xl border bg-card p-4">
              <p className="font-medium">{service.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{service.count} {service.count === 1 ? 'recorte' : 'recortes'}</p>
              <p className="mt-1 text-xl font-semibold">{money(service.total)}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Cada recorte</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(report?.cuts ?? []).map((cut) => (
            <article key={cut.id} className="flex items-start justify-between gap-3 rounded-2xl border bg-card p-4">
              <div>
                <p className="font-medium">{cut.service}</p>
                <p className="mt-1 text-sm text-muted-foreground">{cut.client}</p>
                <p className="text-sm text-muted-foreground">{format(new Date(cut.when), "d 'de' MMMM, h:mm a", { locale: es })}</p>
              </div>
              <p className="font-semibold">{money(cut.price)}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
