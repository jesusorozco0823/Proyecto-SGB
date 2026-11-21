
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { Loader2, LogIn } from 'lucide-react';
import { TotpSetup } from '@/components/auth/totp-setup';


export default function AuthPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Login states
  const [documentLogin, setDocumentLogin] = useState('');
  const [passwordLogin, setPasswordLogin] = useState('password');

  // Signup states
  const [nameSignup, setNameSignup] = useState('');
  const [documentSignup, setDocumentSignup] = useState('');
  const [phoneSignup, setPhoneSignup] = useState('');
  const [passwordSignup, setPasswordSignup] = useState('');
  const [notice, setNotice] = useState('');
  const [mfa, setMfa] = useState<{ challenge: string; otpauthUrl: string | null; setup: boolean } | null>(null);
  const [code, setCode] = useState('');

  const handleAuth = async (documentNumber: string) => {
    setIsLoading(true);
    try {
      const result = await apiClient.post<{ mfa?: string; challenge?: string; otpauthUrl?: string | null }>('/api/v1/auth/login', { documentNumber, password: passwordLogin });
      if (result.mfa && result.challenge) {
        setMfa({ challenge: result.challenge, otpauthUrl: result.otpauthUrl ?? null, setup: result.mfa === 'mfa_setup' });
        setIsLoading(false);
        return;
      }
      router.push('/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo iniciar sesión.');
      setIsLoading(false);
    }
  };

  const handleMfa = async () => {
    if (!mfa) return;
    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/mfa', { challenge: mfa.challenge, code });
      router.push('/dashboard');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'El código no es válido.');
      setIsLoading(false);
    }
  };

  const handleRegistration = async () => {
    if (!nameSignup || !documentSignup || !phoneSignup || !passwordSignup) {
      alert('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/auth/register', {
        displayName: nameSignup,
        documentNumber: documentSignup,
        phone: phoneSignup,
        password: passwordSignup,
      });
      setNotice('Si los datos son válidos, ya puedes iniciar sesión con tu documento.');
      setIsLoading(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-headline font-bold text-primary sm:text-4xl">SalonFlow</h1>
            <p className="text-muted-foreground mt-2">El sistema de gestión premier para barberías modernas.</p>
        </div>
        {notice && <p className="mb-4 text-center text-sm text-muted-foreground">{notice}</p>}
        {mfa ? (
          <Card>
            <CardHeader>
              <CardTitle>{mfa.setup ? 'Activa el segundo factor' : 'Código de verificación'}</CardTitle>
              <CardDescription>
                {mfa.setup
                  ? 'Escanea el código QR y escribe el código de 6 dígitos que muestra la app.'
                  : 'Escribe el código de 6 dígitos de tu aplicación de autenticación.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mfa.setup && mfa.otpauthUrl && <TotpSetup otpauthUrl={mfa.otpauthUrl} />}
              <div className="space-y-2">
                <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
                <Input
                  id="mfa-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={handleMfa} disabled={isLoading}>Confirmar código</Button>
            </CardFooter>
          </Card>
        ) : (
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="signup">Registrarse</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bienvenido de Nuevo</CardTitle>
                <CardDescription>
                  Ingresa tu documento para acceder a tu panel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-login">Número de Documento</Label>
                  <Input 
                    id="document-login" 
                    type="text" 
                    placeholder="Ej: 00000000" 
                    value={documentLogin}
                    onChange={(e) => setDocumentLogin(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Contraseña</Label>
                  <Input 
                    id="password-login" 
                    type="password" 
                    value={passwordLogin}
                    onChange={(e) => setPasswordLogin(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                 <Button onClick={() => handleAuth(documentLogin)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Ingresar
                 </Button>
                 <p className="text-xs text-muted-foreground text-center">O</p>
                <Button variant="outline" className="w-full" disabled>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión con Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Crear una Cuenta</CardTitle>
                <CardDescription>
                  Ingresa tus datos para empezar con SalonFlow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name-signup">Nombre Completo</Label>
                  <Input 
                    id="name-signup" 
                    placeholder="John Doe" 
                    value={nameSignup}
                    onChange={(e) => setNameSignup(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-signup">Número de Documento</Label>
                  <Input 
                    id="document-signup" 
                    type="text" 
                    placeholder="12345678" 
                    value={documentSignup}
                    onChange={(e) => setDocumentSignup(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone-signup">Número de Celular</Label>
                  <Input 
                    id="phone-signup" 
                    type="tel" 
                    placeholder="3001234567" 
                    value={phoneSignup}
                    onChange={(e) => setPhoneSignup(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input 
                    id="password-signup" 
                    type="password"
                    value={passwordSignup}
                    onChange={(e) => setPasswordSignup(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button onClick={handleRegistration} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Crear Cuenta
                </Button>
                 <p className="text-xs text-muted-foreground text-center">O</p>
                <Button variant="outline" className="w-full" disabled>
                  <LogIn className="mr-2 h-4 w-4" />
                  Registrarse con Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </div>
    </div>
  );
}
