
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';
import type { Order } from '@/lib/types';
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import OrderDetailsDialog from '@/components/order-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { openReceipt } from '@/lib/receipt';

export default function OrdersPage() {
    const { role } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        apiClient.get<Order[]>('/api/v1/orders')
            .then((rows) => setOrders(rows.map((row) => ({ ...row, createdAt: new Date(row.createdAt) }))))
            .catch((error) => {
                toast({
                    title: 'No se pudieron cargar los pedidos',
                    description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
                    variant: 'destructive',
                });
            });
    }, [toast]);

    const getOrderDetails = (order: Order) => ({
        user: order.user,
        itemsWithDetails: order.items.map(item => ({
            ...item,
            name: item.name || 'Producto Desconocido',
            imageUrl: item.imageUrl || 'https://placehold.co/100x100.png',
        })),
    });

    const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
        try {
            const updated = await apiClient.patch<Order>(`/api/v1/orders/${orderId}/status`, { status: newStatus });
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId ? { ...updated, createdAt: new Date(updated.createdAt) } : order
                )
            );
            toast({
                title: "Estado del Pedido Actualizado",
                description: `El pedido #${orderId.slice(-4)} ahora está ${getStatusText(newStatus)}.`,
            });
        } catch (error) {
            toast({
                title: 'No se pudo actualizar el pedido',
                description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
                variant: 'destructive',
            });
        }
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
                                            <TableCell className="hidden md:table-cell">{formatCop(order.total)}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => openReceipt(`/api/v1/orders/${order.id}/receipt`).catch((error) => toast({ title: 'No se pudo abrir el comprobante', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Comprobante</DropdownMenuItem>
                                                        {role === 'admin' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && <DropdownMenuItem onClick={() => apiClient.post(`/api/v1/orders/${order.id}/payment`).then(() => { setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, paymentStatus: 'paid' } : item)); toast({ title: 'Pago confirmado' }); }).catch((error) => toast({ title: 'No se pudo confirmar el pago', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Confirmar pago</DropdownMenuItem>}
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
