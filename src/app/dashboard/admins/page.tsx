
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AddAdminDialog from "@/components/add-admin-dialog";
import EditAdminDialog from "@/components/edit-admin-dialog";
import DeleteAdminDialog from "@/components/delete-admin-dialog";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export default function AdminsPage() {
    const [admins, setAdmins] = useState<User[]>([]);
    const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
    const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        void refreshAdmins();
    }, []);

    const refreshAdmins = async () => {
        const rows = await apiClient.get<User[]>('/api/v1/admins');
        setAdmins(rows);
    };

    const handleAddAdmin = async (newAdminData: { displayName: string; documentNumber: string; phone: string; password: string }) => {
        await apiClient.post('/api/v1/admins', newAdminData);
        await refreshAdmins();
        toast({
            title: "Administrador Creado",
            description: `${newAdminData.displayName} ha sido añadido como administrador.`,
        });
        setIsAddAdminDialogOpen(false);
    };

    const handleUpdateAdmin = async (updatedAdmin: User) => {
        await apiClient.patch(`/api/v1/admins/${updatedAdmin.id}`, {
            displayName: updatedAdmin.displayName,
            documentNumber: updatedAdmin.documentNumber,
            phone: updatedAdmin.phone,
        });
        await refreshAdmins();
        toast({
            title: "Administrador Actualizado",
            description: `Los datos de ${updatedAdmin.displayName} han sido actualizados.`,
        });
        setEditingAdmin(null);
    };

    const handleDeleteAdmin = async () => {
        if (!deletingAdmin) return;
        try {
            await apiClient.delete(`/api/v1/admins/${deletingAdmin.id}`);
            await refreshAdmins();
            toast({
                title: "Administrador Eliminado",
                description: `${deletingAdmin.displayName} ha sido eliminado.`,
                variant: "destructive",
            });
            setDeletingAdmin(null);
        } catch (error) {
            toast({
                title: "No se pudo eliminar",
                description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
                variant: "destructive",
            });
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8" />
                            Gestionar Administradores
                        </h1>
                        <p className="text-muted-foreground">Añade, edita o elimina administradores del sistema.</p>
                    </div>
                    <Button onClick={() => setIsAddAdminDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Administrador
                    </Button>
                </div>
                <Card>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Número de Documento</TableHead>
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead><span className="sr-only">Acciones</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {admins.map((admin) => (
                                    <TableRow key={admin.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarImage src={admin.avatarUrl} alt={admin.displayName} />
                                                    <AvatarFallback>{admin.displayName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span>{admin.displayName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{admin.documentNumber}</TableCell>
                                        <TableCell>{admin.phone}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => setEditingAdmin(admin)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={() => setDeletingAdmin(admin)}>Eliminar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <AddAdminDialog
                isOpen={isAddAdminDialogOpen}
                onOpenChange={setIsAddAdminDialogOpen}
                onAddAdmin={handleAddAdmin}
            />

            {editingAdmin && (
                 <EditAdminDialog
                    isOpen={!!editingAdmin}
                    onOpenChange={() => setEditingAdmin(null)}
                    onUpdateAdmin={handleUpdateAdmin}
                    admin={editingAdmin}
                />
            )}

            {deletingAdmin && (
                <DeleteAdminDialog
                    isOpen={!!deletingAdmin}
                    onOpenChange={() => setDeletingAdmin(null)}
                    onConfirmDelete={handleDeleteAdmin}
                    itemName={deletingAdmin.displayName}
                    itemType="administrador"
                />
            )}
        </>
    );
}
