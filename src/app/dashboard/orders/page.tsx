import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockOrders, mockUsers } from "@/lib/mock-data";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function OrdersPage() {

    const getOrderDetails = (order: typeof mockOrders[0]) => {
        const user = mockUsers.find(u => u.id === order.userId);
        return { user };
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
                            {mockOrders.map((order) => {
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
                                                    <DropdownMenuItem>Ver Detalles del Pedido</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <div className="relative">
                                                        <Select defaultValue={order.status}>
                                                            <SelectTrigger className="w-full border-0 focus:ring-0">
                                                                <SelectValue placeholder="Cambiar estado" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="pending">Pendiente</SelectItem>
                                                                <SelectItem value="shipped">Enviado</SelectItem>
                                                                <SelectItem value="delivered">Entregado</SelectItem>
                                                                <SelectItem value="cancelled">Cancelado</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
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
    );
}