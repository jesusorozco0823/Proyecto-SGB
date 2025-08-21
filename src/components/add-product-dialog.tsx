
"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InventoryItem } from '@/lib/types';

interface AddProductDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddProduct: (newProductData: Omit<InventoryItem, 'id'>) => void;
}

export default function AddProductDialog({ isOpen, onOpenChange, onAddProduct }: AddProductDialogProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !stock) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    
    onAddProduct({
        name,
        sku,
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        imageUrl: imageUrl,
    });

    // Reset form
    setName('');
    setSku('');
    setPrice('');
    setStock('');
    setImageUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa los datos para registrar un nuevo producto en el inventario.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-name" className="text-right">Nombre</Label>
                    <Input id="prod-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-sku" className="text-right">SKU</Label>
                    <Input id="prod-sku" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-3" required />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-price" className="text-right">Precio</Label>
                    <Input id="prod-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-stock" className="text-right">Stock</Label>
                    <Input id="prod-stock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-image" className="text-right">URL Imagen</Label>
                    <Input id="prod-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="Opcional" />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <Button type="submit">Añadir Producto</Button>
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
