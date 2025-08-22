
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Barber } from '@/lib/types';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';

interface AddBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddBarber: (newBarberData: Omit<Barber, 'id' | 'rating' | 'schedule' | 'userId'>) => void;
}

export default function AddBarberDialog({ isOpen, onOpenChange, onAddBarber }: AddBarberDialogProps) {
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !skills || !documentNumber || !phone || !password) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onAddBarber({ 
            name,
            documentNumber,
            phone,
            skills: skills.split(',').map(skill => skill.trim()),
            imageUrl: imageUrl || 'https://placehold.co/400x400.png'
        });

        // Reset form
        setName('');
        setDocumentNumber('');
        setPhone('');
        setPassword('');
        setSkills('');
        setImageUrl('');
        setIsLoading(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Barbero</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo perfil de barbero.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-name" className="text-right">Nombre</Label>
                    <Input id="barber-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-doc" className="text-right">Documento</Label>
                    <Input id="barber-doc" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-phone" className="text-right">Celular</Label>
                    <Input id="barber-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-password" className="text-right">Contraseña</Label>
                    <Input id="barber-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-skills" className="text-right">Habilidades</Label>
                    <Textarea id="barber-skills" value={skills} onChange={(e) => setSkills(e.target.value)} className="col-span-3" placeholder="Ej: Cortes Clásicos, Degradados..." required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="barber-image" className="text-right">URL de Imagen</Label>
                    <Input id="barber-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="https://placehold.co/400x400.png" disabled={isLoading} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Añadir Barbero
                </Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
