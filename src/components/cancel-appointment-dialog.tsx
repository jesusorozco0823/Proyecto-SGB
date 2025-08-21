
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (reason: string) => void;
}

export default function CancelAppointmentDialog({ isOpen, onOpenChange, onSubmit }: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    onSubmit(reason);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Cita</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres cancelar tu cita? Si es así, por favor, indícanos el motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Motivo de la cancelación (opcional)</Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Ej: Conflicto de horario, emergencia, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>No, mantener cita</Button>
          <Button variant="destructive" onClick={handleSubmit}>Sí, Cancelar Cita</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
