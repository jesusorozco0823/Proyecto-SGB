
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { mockBarbers } from "@/lib/mock-data";
import type { Barber } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Clock } from "lucide-react";

const timeSlots = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7; // Start from 7 AM
    const minute = (i % 2) * 30;
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
});

const weekDays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const displayDays: { [key: string]: string } = {
    lunes: 'monday',
    martes: 'tuesday',
    miércoles: 'wednesday',
    jueves: 'thursday',
    viernes: 'friday',
    sábado: 'saturday',
    domingo: 'sunday',
};


export default function SchedulePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [barber, setBarber] = useState<Barber | null>(null);
    const [schedule, setSchedule] = useState<Barber['schedule'] | null>(null);

    useEffect(() => {
        if (user) {
            const currentBarber = mockBarbers.find(b => b.userId === user.id);
            if (currentBarber) {
                setBarber(currentBarber);
                // Deep copy to prevent direct mutation of mock data
                setSchedule(JSON.parse(JSON.stringify(currentBarber.schedule)));
            }
        }
    }, [user]);

    const handleToggleDay = (dayKey: string) => {
        if (!schedule) return;
        const isEnabled = schedule[dayKey] !== null;
        const newSchedule = { ...schedule };

        if (isEnabled) {
            newSchedule[dayKey] = null;
        } else {
            newSchedule[dayKey] = { start: '09:00 AM', end: '05:00 PM' }; // Default times
        }
        setSchedule(newSchedule);
    };

    const handleTimeChange = (dayKey: string, type: 'start' | 'end', value: string) => {
        if (!schedule || !schedule[dayKey]) return;
        const newSchedule = { ...schedule };
        newSchedule[dayKey] = { ...newSchedule[dayKey]!, [type]: value };
        setSchedule(newSchedule);
    };

    const handleSaveChanges = () => {
        // In a real app, this would save to a database.
        // Here, we just update the mock data source.
        if (barber && schedule) {
            const barberIndex = mockBarbers.findIndex(b => b.id === barber.id);
            if (barberIndex !== -1) {
                mockBarbers[barberIndex].schedule = schedule;
            }
            toast({
                title: "Horario Actualizado",
                description: "Tus cambios han sido guardados exitosamente.",
            });
        }
    };

    if (!barber || !schedule) {
        return <div>Cargando horario...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
                    <Clock className="h-8 w-8" />
                    Gestionar Mi Horario
                </h1>
                <p className="text-muted-foreground">Define tus días y horas de trabajo para que los clientes puedan reservar.</p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Disponibilidad Semanal</CardTitle>
                    <CardDescription>Activa los días que trabajas y establece tu horario para cada uno.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {weekDays.map((day) => {
                        const dayKey = displayDays[day];
                        const daySchedule = schedule[dayKey];
                        const isEnabled = daySchedule !== null;

                        return (
                            <div key={dayKey} className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg">
                                <div className="flex items-center justify-between md:w-48">
                                    <Label htmlFor={`switch-${dayKey}`} className="capitalize font-semibold text-lg">{day}</Label>
                                    <Switch
                                        id={`switch-${dayKey}`}
                                        checked={isEnabled}
                                        onCheckedChange={() => handleToggleDay(dayKey)}
                                    />
                                </div>
                                <div className={`flex-1 grid grid-cols-2 gap-4 transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                                    <div>
                                        <Label>Inicio</Label>
                                        <Select
                                            value={daySchedule?.start}
                                            onValueChange={(value) => handleTimeChange(dayKey, 'start', value)}
                                            disabled={!isEnabled}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {timeSlots.map(time => <SelectItem key={`start-${dayKey}-${time}`} value={time}>{time}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label>Fin</Label>
                                        <Select
                                            value={daySchedule?.end}
                                            onValueChange={(value) => handleTimeChange(dayKey, 'end', value)}
                                            disabled={!isEnabled}
                                        >
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {timeSlots.map(time => <SelectItem key={`end-${dayKey}-${time}`} value={time}>{time}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                </CardFooter>
            </Card>
        </div>
    );
}
