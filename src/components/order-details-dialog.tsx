
"use client";

import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Order, User } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Separator } from './ui/separator';

interface OrderDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order;
  orderDetails: {
    user: User | undefined;
    itemsWithDetails: (Order['items'][0] & { name: string; imageUrl: string })[];
  };
}

export default function OrderDetailsDialog({ isOpen, onOpenChange, order, orderDetails }: OrderDetailsDialogProps) {
  const { user, itemsWithDetails } = orderDetails;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Detalles del Pedido #{order.id.slice(-6)}</DialogTitle>
          <DialogDescription>
            Realizado el {format(order.createdAt, "d 'de' MMMM, yyyy", { locale: es })}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Cliente</h4>
            <p className="text-muted-foreground">{user?.displayName || 'Desconocido'}</p>
            <p className="text-sm text-muted-foreground">{user?.documentNumber}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2">Artículos del Pedido</h4>
            <div className="space-y-4 max-h-60 overflow-y-auto pr-4">
              {itemsWithDetails.map(item => (
                <div key={item.itemId} className="flex items-center gap-4">
                  <Image src={item.imageUrl} alt={item.name} width={64} height={64} className="rounded-md border object-cover" />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
          <Separator />
          <div className="flex justify-between items-center text-lg">
            <h4 className="font-semibold">Total del Pedido</h4>
            <p className="font-bold">${order.total.toFixed(2)}</p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
