
"use client";

import { useState, useEffect } from "react";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, ShieldCheck } from "lucide-react";
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
    const [query, setQuery] = useState('');
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
                <Input className="h-10 max-w-md rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre o documento" aria-label="Buscar administrador" />
                <div className="mx-auto w-full max-w-3xl space-y-3">
                    {admins.filter((admin) => {
                        const text = `${admin.displayName} ${admin.documentNumber}`.toLowerCase();
                        return !query.trim() || text.includes(query.trim().toLowerCase());
                    }).map((admin) => (
                        <Card key={admin.id}>
                            <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={admin.avatarUrl} alt={admin.displayName} />
                                    <AvatarFallback>{admin.displayName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <CardTitle className="text-lg">{admin.displayName}</CardTitle>
                                    <p className="text-sm text-muted-foreground">{admin.documentNumber} · {admin.phone}</p>
                                </div>
                            </CardHeader>
                            <CardFooter className="flex gap-2 bg-secondary/50 p-4">
                                <Button variant="outline" className="flex-1" onClick={() => setEditingAdmin(admin)}>Editar</Button>
                                <Button variant="outline" className="flex-1 text-destructive" onClick={() => setDeletingAdmin(admin)}>Eliminar</Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
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
