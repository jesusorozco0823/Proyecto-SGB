"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from 'next/navigation';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16c-2.48 0-4.575-1.581-5.335-3.794a4.522 4.522 0 0 1 0-2.412C3.425 7.581 5.52 6 8 6c1.58 0 2.998.636 4.032 1.664L10.75 9.458a2.47 2.47 0 0 0-2.75-.998c-1.354 0-2.454 1.122-2.454 2.5s1.1 2.5 2.454 2.5c1.218 0 2.15-.773 2.36-1.849h-2.36v-2.332h4.492z" />
    </svg>
  );
}


export default function AuthPage() {
  const router = useRouter();

  // In a real app, this would be handled by a proper auth provider.
  const handleLogin = (role: 'client' | 'admin' | 'barber') => {
    localStorage.setItem('userRole', role);
    router.push('/dashboard');
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-headline font-bold text-primary">Sistema de Gestión de Barberías</h1>
            <p className="text-muted-foreground mt-2">El sistema de gestión premier para barberías modernas.</p>
        </div>
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
                  Elige tu rol para acceder a tu panel.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document-login">Número de Documento</Label>
                  <Input id="document-login" type="text" placeholder="12345678" defaultValue="11111111" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Contraseña</Label>
                  <Input id="password-login" type="password" defaultValue="password" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <Button onClick={() => handleLogin('client')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Entrar como Cliente</Button>
                    <Button onClick={() => handleLogin('admin')} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">Entrar como Admin</Button>
                </div>
                 <p className="text-xs text-muted-foreground text-center">O</p>
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
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
                  <Input id="name-signup" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document-signup">Número de Documento</Label>
                  <Input id="document-signup" type="text" placeholder="12345678" />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="phone-signup">Número de Celular</Label>
                  <Input id="phone-signup" type="tel" placeholder="3001234567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Contraseña</Label>
                  <Input id="password-signup" type="password" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button onClick={() => handleLogin('client')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Crear Cuenta</Button>
                 <p className="text-xs text-muted-foreground text-center">O</p>
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Registrarse con Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
