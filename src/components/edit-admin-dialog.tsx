
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { User } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EditAdminDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onUpdateAdmin: (updatedAdmin: User) => void;
  admin: User | null;
}

export default function EditAdminDialog({ isOpen, onOpenChange, onUpdateAdmin, admin }: EditAdminDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (admin) {
      setDisplayName(admin.displayName);
      setDocumentNumber(admin.documentNumber);
      setPhone(admin.phone || '');
    }
  }, [admin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !documentNumber || !phone || !admin) {
        alert("Por favor, completa todos los campos.");
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onUpdateAdmin({ 
            ...admin,
            displayName,
            documentNumber,
            phone,
        });
        setIsLoading(false);
    }, 1000);
  };
  
  const handleClose = () => {
      onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Administrador</DialogTitle>
          <DialogDescription>
            Actualiza los datos del perfil del administrador.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="admin-name-edit">Nombre Completo</Label>
                    <Input id="admin-name-edit" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-doc-edit">Número de Documento</Label>
                    <Input id="admin-doc-edit" value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required disabled={isLoading} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="admin-phone-edit">Teléfono</Label>
                    <Input id="admin-phone-edit" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={isLoading} />
                </div>
            </div>
            <DialogFooter>
            <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
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
