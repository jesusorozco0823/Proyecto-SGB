"use client";

import Image from "next/image";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/app/dashboard/products/page";

interface CartSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
}

export default function CartSheet({ isOpen, onOpenChange, cartItems, onUpdateQuantity }: CartSheetProps) {

  const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col pr-0 sm:max-w-lg">
        <SheetHeader className="px-6">
          <SheetTitle>Mi Carrito</SheetTitle>
        </SheetHeader>
        <Separator />
        {cartItems.length > 0 ? (
          <>
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-6 p-6 text-sm">
                {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border">
                             <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">${item.price.toFixed(2)}</span>
                        </div>
                         <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                                <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                className="h-8 w-14 text-center"
                            />
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                                <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onUpdateQuantity(item.id, 0)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
                </div>
            </ScrollArea>
            <Separator />
            <SheetFooter className="p-6 sm:justify-between">
                <div className="text-lg font-semibold">
                    <span>Total: </span>
                    <span>${total.toFixed(2)}</span>
                </div>
                <Button className="w-full sm:w-auto">Proceder al Pago</Button>
            </SheetFooter>
        </>
        ) : (
            <div className="flex flex-1 items-center justify-center">
                <p className="text-muted-foreground">Tu carrito está vacío.</p>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
