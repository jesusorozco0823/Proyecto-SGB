
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockBarbers } from "@/lib/mock-data";
import { Star, PlusCircle, Phone, Fingerprint } from "lucide-react";
import Image from "next/image";
import type { Barber } from "@/lib/types";
import AddBarberDialog from "@/components/add-barber-dialog";
import EditBarberDialog from "@/components/edit-barber-dialog";
import { useToast } from "@/hooks/use-toast";

export default function BarbersPage() {
    const [barbers, setBarbers] = useState<Barber[]>(mockBarbers);
    const [isAddBarberDialogOpen, setIsAddBarberDialogOpen] = useState(false);
    const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
    const { toast } = useToast();

    const handleAddBarber = (newBarberData: Omit<Barber, 'id' | 'rating' | 'schedule'>) => {
        const newBarber: Barber = {
            id: `barber-${Date.now()}`,
            ...newBarberData,
            rating: 5.0, // Default rating
            schedule: {}, // Default empty schedule
        };
        
        setBarbers(prevBarbers => [...prevBarbers, newBarber]);

        toast({
            title: "Barbero Añadido",
            description: `${newBarber.name} ha sido añadido al equipo.`,
        });

        setIsAddBarberDialogOpen(false);
    };

    const handleUpdateBarber = (updatedBarber: Barber) => {
        setBarbers(prevBarbers => 
            prevBarbers.map(b => b.id === updatedBarber.id ? updatedBarber : b)
        );
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

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {barbers.map((barber) => (
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
