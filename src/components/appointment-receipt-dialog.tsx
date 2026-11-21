"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { formatReceiptWhen, labelDeposit, labelStatus, printReceipt } from '@/lib/receipt';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { formatCop } from '@/lib/money';

type AppointmentReceipt = {
  kind: 'appointment';
  client: string;
  barber?: string;
  when: string;
  services?: { name: string; price: number }[];
  depositAmount?: number;
  depositStatus?: string;
  status: string;
};

function money(value: number) {
  return formatCop(value);
}

export default function AppointmentReceiptDialog({
  appointmentId,
  onOpenChange,
}: {
  appointmentId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [receipt, setReceipt] = useState<AppointmentReceipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!appointmentId) {
      setReceipt(null);
      setError('');
      return;
    }
    let active = true;
    apiClient.get<AppointmentReceipt>(`/api/v1/appointments/${appointmentId}/receipt`)
      .then((result) => {
        if (active) setReceipt(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'No se pudo abrir el comprobante.');
      });
    return () => {
      active = false;
    };
  }, [appointmentId]);

  const services = receipt?.services ?? [];
  const total = services.reduce((sum, item) => sum + item.price, 0);

  return (
    <Dialog open={Boolean(appointmentId)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Comprobante</DialogTitle>
          <DialogDescription>Detalle de la cita para el cliente.</DialogDescription>
        </DialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!receipt && !error && <p className="text-sm text-muted-foreground">Cargando comprobante…</p>}
        {receipt && (
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">Cliente</span><br />{receipt.client}</p>
            {receipt.barber && <p><span className="text-muted-foreground">Barbero</span><br />{receipt.barber}</p>}
            <p><span className="text-muted-foreground">Fecha</span><br />{formatReceiptWhen(receipt.when)}</p>
            <p><span className="text-muted-foreground">Estado</span><br />{labelStatus(receipt.status)}</p>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service.name} className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words">{service.name}</span>
                  <span>{money(service.price)}</span>
                </li>
              ))}
            </ul>
            <p className="flex justify-between gap-3 font-medium"><span>Total del servicio</span><span>{money(total)}</span></p>
            <p>Abono: {money(receipt.depositAmount ?? 0)} · {labelDeposit(receipt.depositStatus ?? '')}</p>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => {
                try {
                  printReceipt(receipt);
                } catch (reason) {
                  toast({ title: 'No se pudo imprimir', description: reason instanceof Error ? reason.message : 'Inténtalo de nuevo.', variant: 'destructive' });
                }
              }}
            >
              Imprimir
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
