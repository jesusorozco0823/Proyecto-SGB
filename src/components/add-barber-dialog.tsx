
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { ImageUpload } from '@/components/image-upload';

interface AddBarberDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddBarber: (newBarberData: {
    name: string;
    documentNumber: string;
    phone: string;
    password: string;
    skills: string[];
    imageUrl: string;
  }) => void | Promise<void>;
}

export default function AddBarberDialog({ isOpen, onOpenChange, onAddBarber }: AddBarberDialogProps) {
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [skills, setSkills] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !skills || !documentNumber || !phone || !password) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }

    setIsLoading(true);
    try {
        await onAddBarber({
            name,
            documentNumber,
            phone,
            password,
            skills: skills.split(',').map(skill => skill.trim()).filter(Boolean),
            imageUrl: imageUrl || 'https://placehold.co/400x400.png'
        });
        setName('');
        setDocumentNumber('');
        setPhone('');
        setPassword('');
        setSkills('');
        setImageUrl('');
    } catch (error) {
        alert(error instanceof Error ? error.message : 'No se pudo crear el barbero.');
    } finally {
        setIsLoading(false);
    }
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
                <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="barber-image" className="pt-2 text-right">Foto</Label>
                    <div className="col-span-3">
                        <ImageUpload id="barber-image" value={imageUrl} onChange={setImageUrl} kind="avatar" disabled={isLoading} />
                    </div>
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
