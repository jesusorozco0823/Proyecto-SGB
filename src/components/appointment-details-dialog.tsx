
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/types';
import { mockBarbers, mockServices } from '@/lib/mock-data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface AppointmentDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment: Appointment;
}

export default function AppointmentDetailsDialog({ isOpen, onOpenChange, appointment }: AppointmentDetailsDialogProps) {
  const barber = mockBarbers.find(b => b.id === appointment.barberId);
  const services = mockServices.filter(s => appointment.serviceIds.includes(s.id));
  const totalCost = services.reduce((acc, service) => acc + service.price, 0);

  const getStatusText = (status: 'scheduled' | 'completed' | 'cancelled') => {
    switch (status) {
      case 'completed': return 'Completada';
      case 'scheduled': return 'Programada';
      case 'cancelled': return 'Cancelada';
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
            <p className="text-muted-foreground">{barber?.name}</p>
          </div>
          <div>
            <h4 className="font-semibold">Fecha y Hora</h4>
            <p className="text-muted-foreground">{format(appointment.datetime, "EEEE, d 'de' MMMM, yyyy 'a las' h:mm a", { locale: es })}</p>
          </div>
          <div>
            <h4 className="font-semibold">Servicios</h4>
            <ul className="list-disc list-inside text-muted-foreground">
              {services.map(s => (
                <li key={s.id}>{s.name} (${s.price.toFixed(2)})</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <h4 className="font-semibold">Coste Total</h4>
            <p className="font-bold text-lg">${totalCost.toFixed(2)}</p>
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
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
