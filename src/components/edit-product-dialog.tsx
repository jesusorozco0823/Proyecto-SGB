
"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { InventoryItem } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface EditProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateProduct: (updatedProduct: InventoryItem) => void;
  product: InventoryItem | null;
}

export default function EditProductDialog({ isOpen, onOpenChange, onUpdateProduct, product }: EditProductDialogProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setPrice(product.price.toString());
      setStock(product.stock.toString());
      setImageUrl(product.imageUrl);
    }
  }, [product]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !price || !stock || !product) {
        alert("Por favor, completa todos los campos obligatorios.");
        return;
    }
    
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
        onUpdateProduct({ 
            ...product,
            name,
            sku,
            price: parseFloat(price),
            stock: parseInt(stock, 10),
            imageUrl: imageUrl || 'https://placehold.co/200x200.png',
        });
        setIsLoading(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onOpenChange(false)}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Editar Producto</DialogTitle>
          <DialogDescription>
            Actualiza los detalles del producto en el inventario.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-name-edit" className="text-right">Nombre</Label>
                    <Input id="prod-name-edit" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-sku-edit" className="text-right">SKU</Label>
                    <Input id="prod-sku-edit" value={sku} onChange={(e) => setSku(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-price-edit" className="text-right">Precio</Label>
                    <Input id="prod-price-edit" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-stock-edit" className="text-right">Stock</Label>
                    <Input id="prod-stock-edit" type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="col-span-3" required disabled={isLoading} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prod-image-edit" className="text-right">URL Imagen</Label>
                    <Input id="prod-image-edit" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="col-span-3" placeholder="Opcional" disabled={isLoading} />
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
