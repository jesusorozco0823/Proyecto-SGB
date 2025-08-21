
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Barber } from '@/lib/types';
import { Textarea } from './ui/textarea';

interface EditBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateBarber: (updatedBarber: Barber) => void;
  barber: Barber | null;
}

export default function EditBarberDialog({ isOpen, onOpenChange, onUpdateBarber, barber }: EditBarberDialogProps) {
  const [name, setName] = useState('');
  const [skills, setSkills] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (barber) {
      setName(barber.name);
      setSkills(barber.skills.join(', '));
      setImageUrl(barber.imageUrl);
    }
  }, [barber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !skills || !imageUrl || !barber) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    
    onUpdateBarber({ 
        ...barber,
        name, 
        skills: skills.split(',').map(skill => skill.trim()),
        imageUrl
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil del Barbero</DialogTitle>
          <DialogDescription>
            Actualiza los datos y el horario del barbero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="barber-name-edit">Nombre Completo</Label>
                    <Input id="barber-name-edit" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barber-skills-edit">Habilidades</Label>
                    <Textarea id="barber-skills-edit" value={skills} onChange={(e) => setSkills(e.target.value)} required />
                    <p className="text-xs text-muted-foreground">Separa las habilidades con comas.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="barber-image-edit">URL de la Imagen</Label>
                    <Input id="barber-image-edit" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} required />
                </div>
                {/* TODO: Add schedule editor here */}
            </div>
            <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Guardar Cambios</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
