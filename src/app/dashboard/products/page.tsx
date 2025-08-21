"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockInventory } from "@/lib/mock-data";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import FloatingCartButton from "@/components/floating-cart-button";
import CartSheet from '@/components/cart-sheet';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export type CartItem = InventoryItem & { quantity: number };

export default function ProductsPage() {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const { toast } = useToast();

    const handleAddToCart = (item: InventoryItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: cartItem.quantity + 1 }
                        : cartItem
                );
            }
            return [...prevCart, { ...item, quantity: 1 }];
        });
        toast({
            title: "¡Producto añadido!",
            description: `${item.name} ha sido añadido a tu carrito.`,
        })
    };
    
    const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
        setCart(prevCart => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.id !== itemId);
            }
            return prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Nuestros Productos</h1>
                <p className="text-muted-foreground">Encuentra los mejores productos para tu cuidado personal.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {mockInventory.map((item) => (
                    <Card key={item.id} className="overflow-hidden flex flex-col">
                        <div className="relative h-56 w-full">
                            <Image
                                src={item.imageUrl}
                                alt={item.name}
                                fill
                                className="object-cover"
                                data-ai-hint="product photo"
                            />
                        </div>
                        <CardHeader>
                            <CardTitle>{item.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                             <p className="text-2xl font-semibold">${item.price.toFixed(2)}</p>
                        </CardContent>
                        <CardFooter>
                             <Button className="w-full" onClick={() => handleAddToCart(item)}>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Añadir al Carrito
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
            
            <FloatingCartButton 
                itemCount={cartItemCount}
                onClick={() => setIsCartOpen(true)}
            />

            <CartSheet 
                isOpen={isCartOpen}
                onOpenChange={setIsCartOpen}
                cartItems={cart}
                onUpdateQuantity={handleUpdateQuantity}
            />
        </div>
    );
}
