
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Star } from 'lucide-react';
import { formatCop } from '@/lib/money';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment: Appointment;
}

export default function AppointmentDetailsDialog({ isOpen, onOpenChange, appointment }: AppointmentDetailsDialogProps) {
  const services = appointment.services ?? [];
  const totalCost = services.reduce((acc, service) => acc + service.price, 0);

  const getStatusText = (status: 'scheduled' | 'completed' | 'cancelled' | 'no_show') => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
      case 'no_show': return 'Inasistencia';
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detalles de la Cita</DialogTitle>
          <DialogDescription>
            Resumen de tu cita programada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h4 className="font-semibold">Barbero</h4>
            <p className="text-muted-foreground">{appointment.barber?.name}</p>
          </div>
          <div>
            <h4 className="font-semibold">Fecha y Hora</h4>
            <p className="text-muted-foreground">{format(appointment.datetime, "EEEE, d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}</p>
          </div>
          <div>
            <h4 className="font-semibold">Servicios</h4>
            <ul className="list-disc list-inside text-muted-foreground">
              {services.map(s => (
                <li key={s.id}>{s.name} ({formatCop(s.price)})</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <h4 className="font-semibold">Coste Total</h4>
            <p className="font-bold text-lg">{formatCop(totalCost)}</p>
          </div>
           <div className="flex justify-between items-center">
            <h4 className="font-semibold">Estado</h4>
            <Badge variant={appointment.status === 'completed' ? 'default' : appointment.status === 'scheduled' ? 'secondary' : 'destructive'}>
                {getStatusText(appointment.status)}
            </Badge>
          </div>
           {appointment.status === 'cancelled' && appointment.cancellationReason && (
            <>
                <Separator />
                <div>
                    <h4 className="font-semibold">Motivo de Cancelación</h4>
                    <p className="text-muted-foreground italic">"{appointment.cancellationReason}"</p>
                </div>
            </>
          )}
          {appointment.status === 'completed' && appointment.rating && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Tu Opinión</h4>
                <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                            key={i}
                            className={`w-5 h-5 ${i < appointment.rating! ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                        />
                    ))}
                </div>
                <p className="text-muted-foreground italic">"{appointment.comment}"</p>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
