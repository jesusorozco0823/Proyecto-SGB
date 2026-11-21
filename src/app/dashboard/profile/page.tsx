
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
import { apiClient } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { Modal } from '@/components/ui/modal';
import { ImageUpload } from '@/components/image-upload';

function PasswordChange() {
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const save = async () => {
        try {
            await apiClient.patch('/api/v1/users/me/password', { currentPassword, newPassword });
            toast({ title: 'Contraseña actualizada', description: 'Vuelve a iniciar sesión.' });
            window.location.href = '/';
        } catch (error) {
            toast({ title: 'No se pudo cambiar la contraseña', description: error instanceof Error ? error.message : 'Revisa los datos.', variant: 'destructive' });
        }
    };
    return (
        <div className="grid w-full gap-2">
            <Label htmlFor="currentPassword">Contraseña actual</Label>
            <Input id="currentPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
            <Label htmlFor="newPassword">Nueva contraseña</Label>
            <Input id="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            <Button variant="secondary" onClick={save}>Cambiar contraseña</Button>
        </div>
    );
}

export default function ProfilePage() {
    const { user, refresh } = useAuth();
    const { toast } = useToast();
    
    // Local state for form fields
    const [displayName, setDisplayName] = useState('');
    const [phone, setPhone] = useState('');
    const [preferences, setPreferences] = useState('');
    const [photoOpen, setPhotoOpen] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const [photoBusy, setPhotoBusy] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName);
            setPhone(user.phone || '');
            setPreferences(user.preferences?.join(', ') || '');
            setPhotoUrl(user.avatarUrl || '');
        }
    }, [user]);

    const handleSavePhoto = async () => {
        try {
            await apiClient.patch('/api/v1/users/me', { avatarUrl: photoUrl });
            await refresh();
            setPhotoOpen(false);
            toast({ title: 'Foto actualizada', description: 'Tu foto de perfil quedó guardada.' });
        } catch (error) {
            toast({
                title: 'No se pudo cambiar la foto',
                description: error instanceof Error ? error.message : 'Usa una URL válida.',
                variant: 'destructive',
            });
        }
    };

    if (!user) {
        return <div>Cargando...</div>;
    }

    const userInitials = user.displayName?.split(' ').map(n => n[0]).join('') || 'U';

    const handleSaveChanges = async () => {
        try {
            await apiClient.patch('/api/v1/users/me', {
                displayName,
                phone,
                preferences: preferences.split(',').map((item) => item.trim()).filter(Boolean),
            });
            await refresh();
            toast({
                title: "Perfil Actualizado",
                description: "Tus cambios han sido guardados exitosamente.",
            });
        } catch (error) {
            toast({
                title: 'No se pudo guardar el perfil',
                description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
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
                    <CardFooter className="flex flex-col items-start gap-4">
                        <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
                        <PasswordChange />
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
                    <Button variant="outline" className="mt-4" onClick={() => setPhotoOpen(true)}>Cambiar Foto</Button>
                </Card>
                
                <RecommendedServices />
            </div>
        </div>
        <Modal
            open={photoOpen}
            onOpenChange={setPhotoOpen}
            title="Cambiar foto"
            description="Elige una foto. Se reduce y se guarda como enlace público."
            footer={(
                <>
                    <Button variant="outline" onClick={() => setPhotoOpen(false)} disabled={photoBusy}>Cancelar</Button>
                    <Button onClick={handleSavePhoto} disabled={photoBusy || !photoUrl}>Guardar foto</Button>
                </>
            )}
        >
            <div className="space-y-2">
                <Label htmlFor="photoUrl">Foto</Label>
                <ImageUpload id="photoUrl" value={photoUrl} onChange={setPhotoUrl} kind="avatar" onBusy={setPhotoBusy} />
            </div>
        </Modal>
        </>
    );
}
