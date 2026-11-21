"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import FloatingCartButton from "@/components/floating-cart-button";
import CartSheet from '@/components/cart-sheet';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';

export type CartItem = InventoryItem & { quantity: number };

export default function ProductsPage() {
    const [products, setProducts] = useState<InventoryItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        apiClient.get<InventoryItem[]>('/api/v1/inventory').then(setProducts).catch(() => setProducts([]));
    }, []);

    const handleAddToCart = (item: InventoryItem) => {
        setCart(prevCart => {
            const existingItem = prevCart.find(cartItem => cartItem.id === item.id);
            if (existingItem) {
                return prevCart.map(cartItem =>
                    cartItem.id === item.id
                        ? { ...cartItem, quantity: Math.min(5, cartItem.quantity + 1) }
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
            if (newQuantity > 5) return prevCart;
            return prevCart.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            );
        });
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        try {
            await apiClient.post('/api/v1/orders', {
                items: cart.map((item) => ({ itemId: item.id, quantity: item.quantity })),
            });
            setCart([]);
            setIsCartOpen(false);
            toast({ title: 'Pedido creado', description: 'Quedó pendiente de pago. El salón confirma el pago para despacharlo.' });
            setProducts(await apiClient.get<InventoryItem[]>('/api/v1/inventory'));
        } catch (error) {
            toast({
                title: 'No se pudo crear el pedido',
                description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setCheckingOut(false);
        }
    };

    const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Nuestros Productos</h1>
                <p className="text-muted-foreground">Encuentra los mejores productos para tu cuidado personal.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((item) => (
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
                             <p className="text-2xl font-semibold">{formatCop(item.price)}</p>
                             <p className="text-sm text-muted-foreground">{item.availability === 'ultimas' ? 'Últimas unidades' : item.availability === 'agotado' ? 'Agotado' : 'Disponible'}</p>
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
                onCheckout={handleCheckout}
                checkingOut={checkingOut}
            />
        </div>
    );
}
