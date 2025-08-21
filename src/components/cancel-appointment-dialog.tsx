
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Wand2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { suggestCancellationReasons } from '@/ai/flows/suggest-cancellation-reasons';

interface CancelAppointmentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (reason: string) => void;
}

export default function CancelAppointmentDialog({ isOpen, onOpenChange, onSubmit }: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState('');
  const [suggestedReasons, setSuggestedReasons] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        try {
          const result = await suggestCancellationReasons();
          setSuggestedReasons(result.reasons);
        } catch (error) {
          console.error("Failed to fetch cancellation reason suggestions:", error);
          // Fallback reasons in case of an error
          setSuggestedReasons(["Conflicto de horario", "Emergencia personal", "Ya no es necesario"]);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    } else {
      // Reset state when dialog closes
      setReason('');
      setSuggestedReasons([]);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancelar Cita</DialogTitle>
          <DialogDescription>
            ¿Estás seguro de que quieres cancelar tu cita? Por favor, indícanos el motivo.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cancellation-reason">Motivo de la cancelación (obligatorio)</Label>
            <Textarea
              id="cancellation-reason"
              placeholder="Ej: Tengo un conflicto de horario..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wand2 className="h-4 w-4" />
              Sugerencias de IA
            </Label>
             <div className="flex flex-wrap gap-2">
              {loadingSuggestions ? (
                <>
                  <Skeleton className="h-9 w-32" />
                  <Skeleton className="h-9 w-40" />
                  <Skeleton className="h-9 w-28" />
                </>
              ) : (
                suggestedReasons.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setReason(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>No, mantener cita</Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={!reason.trim()}>Sí, Cancelar Cita</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
