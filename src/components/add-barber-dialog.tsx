
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Barber } from '@/lib/types';
import { Textarea } from './ui/textarea';

interface AddBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddBarber: (newBarberData: Omit<Barber, 'id' | 'rating' | 'schedule'>) => void;
}

export default function AddBarberDialog({ isOpen, onOpenChange, onAddBarber }: AddBarberDialogProps) {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !skills || !imageUrl) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    
    onAddBarber({ 
        name, 
        skills: skills.split(',').map(skill => skill.trim()),
        imageUrl
    });

    // Reset form
    setName('');
    setSkills('');
    setImageUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Barbero</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo perfil de barbero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="barber-name">Nombre Completo</Label>
                    <Input id="barber-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Carlos 'El Cuchillas' Mendoza" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barber-skills">Habilidades</Label>
                    <Textarea id="barber-skills" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Ej: Cortes Clásicos, Degradados, Afeitado" required />
                    <p className="text-xs text-muted-foreground">Separa las habilidades con comas.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barber-image">URL de la Imagen</Label>
                    <Input id="barber-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://placehold.co/400x400.png" required />
                </div>
            </div>
            <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Añadir Barbero</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
