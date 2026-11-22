
"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiClient } from '@/lib/api-client';
import { formatCop } from '@/lib/money';
import type { Order } from '@/lib/types';
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
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
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
                <div className="flex flex-col gap-3 rounded-2xl border bg-card p-3">
                    <Input className="h-10 rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" aria-label="Buscar cliente" />
                    <div className="flex flex-wrap gap-2">
                        {([['all', 'Todos'], ['pending', 'Pendientes'], ['shipped', 'Enviados'], ['delivered', 'Entregados'], ['cancelled', 'Cancelados']] as const).map(([value, label]) => (
                            <Button key={value} type="button" variant={statusFilter === value ? 'default' : 'outline'} className="h-10 rounded-full px-4" onClick={() => setStatusFilter(value)}>{label}</Button>
                        ))}
                    </div>
                </div>
                <div className="mx-auto w-full max-w-3xl space-y-3">
                    {orders.filter((order) => {
                        const name = order.user?.displayName ?? '';
                        const matchesQuery = !query.trim() || name.toLowerCase().includes(query.trim().toLowerCase());
                        return matchesQuery && (statusFilter === 'all' || order.status === statusFilter);
                    }).map((order) => {
                        const { user } = getOrderDetails(order);
                        return (
                            <Card key={order.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <CardTitle className="text-lg">{user?.displayName || 'Usuario desconocido'}</CardTitle>
                                            <p className="text-sm text-muted-foreground">{format(order.createdAt, "d 'de' MMMM, yyyy", { locale: es })} · {formatCop(order.total)}</p>
                                        </div>
                                        <Badge variant={getStatusVariant(order.status)}>{getStatusText(order.status)}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Select value={order.status} onValueChange={(value) => handleStatusChange(order.id, value as Order['status'])}>
                                        <SelectTrigger className="h-11" aria-label={`Estado del pedido de ${user?.displayName || 'cliente'}`}><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pendiente</SelectItem>
                                            <SelectItem value="shipped">Enviado</SelectItem>
                                            <SelectItem value="delivered">Entregado</SelectItem>
                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                                <CardFooter className="flex flex-wrap gap-2 bg-secondary/50 p-4">
                                    <Button variant="outline" onClick={() => setViewingOrder(order)}>Ver detalles</Button>
                                    <Button variant="outline" onClick={() => openReceipt(`/api/v1/orders/${order.id}/receipt`).catch((error) => toast({ title: 'No se pudo abrir el comprobante', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Comprobante</Button>
                                    {role === 'admin' && order.paymentStatus !== 'paid' && order.status !== 'cancelled' && <Button onClick={() => apiClient.post(`/api/v1/orders/${order.id}/payment`).then(() => { setOrders((prev) => prev.map((item) => item.id === order.id ? { ...item, paymentStatus: 'paid' } : item)); toast({ title: 'Pago confirmado' }); }).catch((error) => toast({ title: 'No se pudo confirmar el pago', description: error instanceof Error ? error.message : 'Inténtalo de nuevo.', variant: 'destructive' }))}>Confirmar pago</Button>}
                                </CardFooter>
                            </Card>
                        );
                    })}
                    {orders.length === 0 && <p className="rounded-2xl border bg-card p-6 text-center text-sm text-muted-foreground">No hay pedidos.</p>}
                </div>
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
