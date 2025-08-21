
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Wand2 } from 'lucide-react';
import type { Appointment } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { suggestFeedback } from '@/ai/flows/suggest-feedback';
import { mockBarbers, mockServices } from '@/lib/mock-data';
import { Skeleton } from './ui/skeleton';

interface FeedbackDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  appointment: Appointment;
  onSubmit: (rating: number, comment: string) => void;
}

export default function FeedbackDialog({ isOpen, onOpenChange, appointment, onSubmit }: FeedbackDialogProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const appointmentServices = mockServices.filter(s => appointment.serviceIds.includes(s.id));
  const appointmentBarber = mockBarbers.find(b => b.id === appointment.barberId);

  useEffect(() => {
    if (rating > 0 && isOpen) {
      const fetchSuggestions = async () => {
        setLoadingSuggestions(true);
        setSuggestions([]);
        try {
          const result = await suggestFeedback({
            rating,
            serviceName: appointmentServices.map(s => s.name).join(', '),
            barberName: appointmentBarber?.name || 'el barbero',
          });
          setSuggestions(result.suggestions);
        } catch (error)          {
          console.error("Failed to fetch feedback suggestions:", error);
        } finally {
          setLoadingSuggestions(false);
        }
      };
      fetchSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [rating, isOpen, appointment.id, appointmentServices, appointmentBarber]);
  
  useEffect(() => {
    // Reset state only when dialog is closed
    if (!isOpen) {
      const timer = setTimeout(() => {
        setRating(0);
        setComment('');
        setSuggestions([]);
        setHoverRating(0);
      }, 300); // Delay to allow fade-out animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    toast({
        title: "¡Gracias por tu opinión!",
        description: "Tus comentarios nos ayudan a mejorar.",
    })
    onSubmit(rating, comment);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deja tu opinión</DialogTitle>
          <DialogDescription>
            Cuéntanos cómo fue tu experiencia. Tus comentarios son importantes para nosotros.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Calificación (obligatoria)</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-8 w-8 cursor-pointer transition-colors",
                    (hoverRating >= star || rating >= star)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  )}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario (obligatorio)</Label>
            <Textarea
              id="comment"
              placeholder="Describe tu experiencia..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          {(loadingSuggestions || suggestions.length > 0) && (
            <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Wand2 className="h-4 w-4" />
                    Sugerencias de IA
                </Label>
                <div className="flex flex-wrap gap-2">
                    {loadingSuggestions ? (
                        <>
                            <Skeleton className="h-9 w-full" />
                            <Skeleton className="h-9 w-11/12" />
                        </>
                    ) : (
                        suggestions.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => setComment(suggestion)}
                                className="h-auto text-wrap text-left"
                            >
                                {suggestion}
                            </Button>
                        ))
                    )}
                </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={rating === 0 || comment.trim() === ''}>Enviar Opinión</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
