
"use client";

import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockOrders, mockUsers, mockInventory } from "@/lib/mock-data";
import type { Order } from '@/lib/types';
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderDetailsDialog from '@/components/order-details-dialog';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const { toast } = useToast();

    const getOrderDetails = (order: Order) => {
        const user = mockUsers.find(u => u.id === order.userId);
        const itemsWithDetails = order.items.map(item => {
            const product = mockInventory.find(p => p.id === item.itemId);
            return {
                ...item,
                name: product?.name || 'Producto Desconocido',
                imageUrl: product?.imageUrl || 'https://placehold.co/100x100.png',
            }
        });
        return { user, itemsWithDetails };
    };

    const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
        setOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );
        toast({
            title: "Estado del Pedido Actualizado",
            description: `El pedido #${orderId.slice(-4)} ahora está ${getStatusText(newStatus)}.`,
        });
    };

    const getStatusVariant = (status: 'pending' | 'shipped' | 'delivered' | 'cancelled') => {
        switch (status) {
            case 'delivered': return 'default';
            case 'pending': return 'secondary';
            case 'shipped': return 'outline';
            case 'cancelled': return 'destructive';
            default: return 'outline';
        }
    }
    
    const getStatusText = (status: 'pending' | 'shipped' | 'delivered' | 'cancelled') => {
        switch (status) {
            case 'pending': return 'Pendiente';
            case 'shipped': return 'Enviado';
            case 'delivered': return 'Entregado';
            case 'cancelled': return 'Cancelado';
        }
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de Pedidos</h1>
                    <p className="text-muted-foreground">Revisa y actualiza el estado de los pedidos de productos.</p>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="hidden md:table-cell">Total</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>
                                        <span className="sr-only">Acciones</span>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orders.map((order) => {
                                    const { user } = getOrderDetails(order);
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">{user?.displayName || 'Usuario Desconocido'}</TableCell>
                                            <TableCell>{format(order.createdAt, "d 'de' MMMM, yyyy", { locale: es })}</TableCell>
                                            <TableCell className="hidden md:table-cell">${order.total.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Badge variant={getStatusVariant(order.status)}>
                                                    {getStatusText(order.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                            <span className="sr-only">Alternar menú</span>
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => setViewingOrder(order)}>Ver Detalles del Pedido</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <div className="px-2 py-1.5 text-sm">Cambiar estado</div>
                                                        <Select defaultValue={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                                                            <SelectTrigger className="w-[calc(100%_-_1rem)] mx-auto border-0 focus:ring-0">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pendiente</SelectItem>
                                                                <SelectItem value="shipped">Enviado</SelectItem>
                                                                <SelectItem value="delivered">Entregado</SelectItem>
                                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            {viewingOrder && (
                <OrderDetailsDialog
                    isOpen={!!viewingOrder}
                    onOpenChange={() => setViewingOrder(null)}
                    order={viewingOrder}
                    orderDetails={getOrderDetails(viewingOrder)}
                />
            )}
        </>
    );
}
