
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, PlusCircle, Phone, Fingerprint } from "lucide-react";
import Image from "next/image";
import type { Barber } from "@/lib/types";
import AddBarberDialog from "@/components/add-barber-dialog";
import EditBarberDialog from "@/components/edit-barber-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api-client";

export default function BarbersPage() {
    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [isAddBarberDialogOpen, setIsAddBarberDialogOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
    const [query, setQuery] = useState('');
    const { toast } = useToast();

    const loadBarbers = async () => {
        setBarbers(await apiClient.get<Barber[]>('/api/v1/barbers'));
    };

    useEffect(() => {
        void loadBarbers();
    }, []);

    const handleAddBarber = async (newBarberData: { name: string; documentNumber: string; phone: string; password: string; skills: string[]; imageUrl: string }) => {
        await apiClient.post('/api/v1/barbers', newBarberData);
        await loadBarbers();
        toast({
            title: "Barbero Añadido",
            description: `${newBarberData.name} ha sido añadido al equipo.`,
        });
        setIsAddBarberDialogOpen(false);
    };

    const handleUpdateBarber = async (updatedBarber: Barber) => {
        await apiClient.patch(`/api/v1/barbers/${updatedBarber.id}`, {
            name: updatedBarber.name,
            documentNumber: updatedBarber.documentNumber,
            phone: updatedBarber.phone,
            skills: updatedBarber.skills,
            imageUrl: updatedBarber.imageUrl,
        });
        await loadBarbers();
        toast({
            title: "Perfil Actualizado",
            description: `Los datos de ${updatedBarber.name} han sido actualizados.`,
        });
        setEditingBarber(null);
    };


    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gestionar Barberos</h1>
                        <p className="text-muted-foreground">Añade, edita y gestiona los perfiles y horarios de los barberos.</p>
                    </div>
                    <Button onClick={() => setIsAddBarberDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Barbero
                    </Button>
                </div>

                <Input className="h-10 max-w-md rounded-full" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar barbero" aria-label="Buscar barbero" />
                <div className="mx-auto w-full max-w-3xl space-y-4">
                    {barbers.filter((barber) => !query.trim() || `${barber.name} ${barber.skills.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase())).map((barber) => (
                        <Card key={barber.id} className="overflow-hidden flex flex-col">
                            <div className="relative h-48 w-full">
                                <Image
                                    src={barber.imageUrl}
                                    alt={barber.name}
                                    fill
                                    className="object-cover"
                                    data-ai-hint="barber portrait"
                                />
                            </div>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle>{barber.name}</CardTitle>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                            <span>{barber.rating}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow space-y-4">
                                <div>
                                    <p className="text-sm font-semibold mb-2">Habilidades:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {barber.skills.map((skill) => (
                                            <Badge key={skill} variant="secondary">{skill}</Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm text-muted-foreground">
                                     <div className="flex items-center gap-2">
                                        <Fingerprint className="h-4 w-4" />
                                        <span>{barber.documentNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{barber.phone}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-secondary/50 p-4 mt-auto">
                                <Button variant="outline" className="w-full" onClick={() => setEditingBarber(barber)}>
                                    Editar Horario y Perfil
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
            <AddBarberDialog 
                isOpen={isAddBarberDialogOpen}
                onOpenChange={setIsAddBarberDialogOpen}
                onAddBarber={handleAddBarber}
            />
            {editingBarber && (
                 <EditBarberDialog
                    isOpen={!!editingBarber}
                    onOpenChange={() => setEditingBarber(null)}
                    onUpdateBarber={handleUpdateBarber}
                    barber={editingBarber}
                />
            )}
        </>
    );
}
