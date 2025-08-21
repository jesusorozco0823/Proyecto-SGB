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
            <h1 className="text-4xl font-headline font-bold text-primary">SalonFlow</h1>
            <p className="text-muted-foreground mt-2">The premier management system for modern barbershops.</p>
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Welcome Back</CardTitle>
                <CardDescription>
                  Choose your role to access your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-login">Email</Label>
                  <Input id="email-login" type="email" placeholder="m@example.com" defaultValue="client@salonflow.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-login">Password</Label>
                  <Input id="password-login" type="password" defaultValue="password" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                    <Button onClick={() => handleLogin('client')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Login as Client</Button>
                    <Button onClick={() => handleLogin('admin')} className="w-full bg-secondary hover:bg-secondary/80 text-secondary-foreground">Login as Admin</Button>
                </div>
                 <p className="text-xs text-muted-foreground text-center">Or</p>
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign in with Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Create an Account</CardTitle>
                <CardDescription>
                  Enter your details to get started with SalonFlow.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label htmlFor="name-signup">Full Name</Label>
                  <Input id="name-signup" placeholder="John Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input id="email-signup" type="email" placeholder="m@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input id="password-signup" type="password" />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button onClick={() => handleLogin('client')} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">Create Account</Button>
                 <p className="text-xs text-muted-foreground text-center">Or</p>
                <Button variant="outline" className="w-full">
                  <GoogleIcon className="mr-2 h-4 w-4" />
                  Sign up with Google
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
