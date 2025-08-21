
"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { mockUsers } from "@/lib/mock-data";
import { MoreHorizontal, PlusCircle, ShieldCheck } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import AddAdminDialog from "@/components/add-admin-dialog";
import EditAdminDialog from "@/components/edit-admin-dialog";
import DeleteAdminDialog from "@/components/delete-admin-dialog";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

export default function AdminsPage() {
    const [admins, setAdmins] = useState<User[]>(mockUsers.filter(user => user.role === 'admin'));
    const [isAddAdminDialogOpen, setIsAddAdminDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
    const [deletingAdmin, setDeletingAdmin] = useState<User | null>(null);
    const { toast } = useToast();

    const handleAddAdmin = (newAdminData: Omit<User, 'id' | 'role' | 'avatarUrl'>) => {
        const newAdmin: User = {
            id: `user-${Date.now()}`,
            ...newAdminData,
            role: 'admin',
            avatarUrl: 'https://placehold.co/100x100.png',
        };
        
        mockUsers.push(newAdmin);
        setAdmins(mockUsers.filter(user => user.role === 'admin'));


        toast({
            title: "Administrador Creado",
            description: `${newAdmin.displayName} ha sido añadido como administrador.`,
        });

        setIsAddAdminDialogOpen(false);
    };

    const handleUpdateAdmin = (updatedAdmin: User) => {
        const adminIndex = mockUsers.findIndex(user => user.id === updatedAdmin.id);
        if (adminIndex !== -1) {
            mockUsers[adminIndex] = updatedAdmin;
        }
        setAdmins(mockUsers.filter(user => user.role === 'admin'));
        toast({
            title: "Administrador Actualizado",
            description: `Los datos de ${updatedAdmin.displayName} han sido actualizados.`,
        });
        setEditingAdmin(null);
    };

    const handleDeleteAdmin = () => {
        if (!deletingAdmin) return;
        const adminIndex = mockUsers.findIndex(user => user.id === deletingAdmin.id);
        if (adminIndex !== -1) {
            mockUsers.splice(adminIndex, 1);
        }
        setAdmins(mockUsers.filter(user => user.role === 'admin'));
        toast({
            title: "Administrador Eliminado",
            description: `${deletingAdmin.displayName} ha sido eliminado.`,
            variant: "destructive",
        });
        setDeletingAdmin(null);
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
