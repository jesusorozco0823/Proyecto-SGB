
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Barber } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

interface EditBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateBarber: (updatedBarber: Barber) => void;
  barber: Barber | null;
}

export default function EditBarberDialog({ isOpen, onOpenChange, onUpdateBarber, barber }: EditBarberDialogProps) {
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (barber) {
      setName(barber.name);
      setDocumentNumber(barber.documentNumber);
      setPhone(barber.phone);
      setSkills(barber.skills.join(', '));
      setImageUrl(barber.imageUrl);
    }
  }, [barber]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !skills || !documentNumber || !phone || !barber) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onUpdateBarber({ 
            ...barber,
            name,
            documentNumber,
            phone,
            skills: skills.split(',').map(skill => skill.trim()),
            imageUrl: imageUrl || 'https://placehold.co/400x400.png'
        });
        setIsLoading(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Perfil del Barbero</DialogTitle>
          <DialogDescription>
            Actualiza los datos y el horario del barbero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-name-edit" className="text-right">Nombre</Label>
                    <Input id="barber-name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-doc-edit" className="text-right">Documento</Label>
                    <Input id="barber-doc-edit" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-phone-edit" className="text-right">Celular</Label>
                    <Input id="barber-phone-edit" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-skills-edit" className="text-right">Habilidades</Label>
                    <Textarea id="barber-skills-edit" value={skills} onChange={(e) => setSkills(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-image-edit" className="text-right">URL de Imagen</Label>
                    <Input id="barber-image-edit" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" disabled={isLoading} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Cambios
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
