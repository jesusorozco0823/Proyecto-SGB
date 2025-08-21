
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import RecommendedServices from '@/components/recommended-services';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
    const { user } = useAuth();
    const { toast } = useToast();
    
    // Local state for form fields
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [preferences, setPreferences] = useState('');

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName);
            setPhone(user.phone || '');
            setPreferences(user.preferences?.join(', ') || '');
        }
    }, [user]);

    if (!user) {
        return <div>Cargando...</div>;
    }

    const userInitials = user.displayName?.split(' ').map(n => n[0]).join('') || 'U';

    const handleSaveChanges = () => {
        // Here you would typically call an API to save the changes.
        // For this mock, we'll just show a toast notification.
        console.log("Saving changes:", { displayName, phone, preferences });
        toast({
            title: "Perfil Actualizado",
            description: "Tus cambios han sido guardados exitosamente.",
        });
    };

    return (
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Información de Perfil</CardTitle>
                        <CardDescription>Actualiza tus datos personales y preferencias.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Nombre Completo</Label>
                            <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="documentNumber">Número de Documento</Label>
                            <Input id="documentNumber" type="text" value={user.documentNumber} readOnly />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="preferences">Preferencias</Label>
                            <Textarea
                                id="preferences"
                                placeholder="ej., Estilos modernos, arreglos de barba, citas tranquilas..."
                                value={preferences}
                                onChange={(e) => setPreferences(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Deja que tus barberos sepan lo que te gusta para tener la mejor experiencia.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                    </CardFooter>
                </Card>
            </div>
            
            <div className="space-y-6">
                <Card className="flex flex-col items-center text-center p-6">
                    <Avatar className="w-24 h-24 mb-4 border-4 border-primary">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-3xl">{userInitials}</AvatarFallback>
                    </Avatar>
                    <h2 className="text-xl font-bold">{user.displayName}</h2>
                    <p className="text-muted-foreground">{user.documentNumber}</p>
                    <Button variant="outline" className="mt-4">Cambiar Foto</Button>
                </Card>
                
                <RecommendedServices />
            </div>
        </div>
    );
}
