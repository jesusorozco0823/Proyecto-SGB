
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/types';

interface AddAdminDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddAdmin: (newAdminData: Omit<User, 'id' | 'role' | 'avatarUrl'>) => void;
}

export default function AddAdminDialog({ isOpen, onOpenChange, onAddAdmin }: AddAdminDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !documentNumber || !phone || !password) {
        // Simple validation
        alert("Por favor, completa todos los campos.");
        return;
    }
    
    onAddAdmin({ displayName, documentNumber, phone });

    // Reset form
    setDisplayName('');
    setDocumentNumber('');
    setPhone('');
    setPassword('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Administrador</DialogTitle>
          <DialogDescription>
            Completa los datos para crear un nuevo perfil de administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="admin-name">Nombre Completo</Label>
                    <Input id="admin-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Ej: Maria Garcia" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-doc">Número de Documento</Label>
                    <Input id="admin-doc" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} placeholder="Ej: 22222222" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-phone">Teléfono</Label>
                    <Input id="admin-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 555-0102" required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="admin-password">Contraseña</Label>
                    <Input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
            </div>
            <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">Crear Administrador</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
