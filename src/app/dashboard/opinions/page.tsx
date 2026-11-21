"use client";

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageSquare, Star } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Appointment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import FeedbackDialog from '@/components/feedback-dialog';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${rating} de 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`h-4 w-4 ${star <= rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
      ))}
    </span>
  );
}

export default function OpinionsPage() {
  const { toast } = useToast();
  const [visits, setVisits] = useState<Appointment[]>([]);
  const [writing, setWriting] = useState<Appointment | null>(null);

  useEffect(() => {
    apiClient.get<Appointment[]>('/api/v1/appointments')
      .then((rows) => setVisits(rows
        .map((row) => ({ ...row, datetime: new Date(row.datetime) }))
        .filter((row) => row.status === 'completed')
        .sort((left, right) => right.datetime.getTime() - left.datetime.getTime())))
      .catch((error) => toast({
        title: 'No se pudieron cargar las visitas',
        description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        variant: 'destructive',
      }));
  }, [toast]);

  const pending = visits.filter((visit) => !visit.rating);
  const written = visits.filter((visit) => visit.rating);

  const save = async (rating: number, comment: string) => {
    if (!writing) return;
    await apiClient.post(`/api/v1/appointments/${writing.id}/feedback`, { rating, comment });
    setVisits((current) => current.map((visit) => visit.id === writing.id ? { ...visit, rating, comment } : visit));
    setWriting(null);
    toast({ title: 'Opinión enviada', description: 'Gracias. El salón ya puede verla.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Opiniones</h1>
        <p className="text-muted-foreground">Cuéntanos cómo te fue. Solo puedes opinar de una visita ya completada.</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Por opinar</h2>
        {pending.length === 0 && (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">No tienes visitas pendientes de opinión.</p>
        )}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {pending.map((visit) => (
            <article key={visit.id} className="rounded-2xl border bg-card p-4">
              <p className="font-medium">{visit.services?.map((service) => service.name).join(', ') || 'Servicio'}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {format(visit.datetime, "d 'de' MMMM, yyyy", { locale: es })}
                {visit.barber ? ` · ${visit.barber.name}` : ''}
              </p>
              <Button className="mt-4" onClick={() => setWriting(visit)}>
                <MessageSquare className="mr-2 h-4 w-4" />
                Dejar opinión
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Ya opinaste</h2>
        {written.length === 0 && <p className="text-sm text-muted-foreground">Todavía no has dejado opiniones.</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {written.map((visit) => (
            <article key={visit.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{visit.services?.map((service) => service.name).join(', ') || 'Servicio'}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {format(visit.datetime, "d 'de' MMMM, yyyy", { locale: es })}
                    {visit.barber ? ` · ${visit.barber.name}` : ''}
                  </p>
                </div>
                <Stars rating={visit.rating ?? 0} />
              </div>
              {visit.comment && <p className="mt-3 text-sm text-muted-foreground">{visit.comment}</p>}
            </article>
          ))}
        </div>
      </section>

      {writing && (
        <FeedbackDialog
          isOpen={!!writing}
          onOpenChange={(open) => { if (!open) setWriting(null); }}
          appointment={writing}
          onSubmit={save}
        />
      )}
    </div>
  );
}
