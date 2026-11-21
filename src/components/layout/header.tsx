"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Menu, User, LogOut } from "lucide-react";
import Link from "next/link";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SidebarContent from "./sidebar-content";

export default function Header() {
  const { user, logout, role } = useAuth();

  const getTitle = () => {
      switch (role) {
          case 'superadmin':
              return 'Panel de Super Administrador';
          case 'admin':
              return 'Panel de Administrador';
          case 'barber':
              return 'Panel del Barbero';
          default:
              return 'Portal de Cliente';
      }
  }

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b bg-card px-3 py-2 md:px-6">
        <div className="flex min-w-0 items-center gap-3">
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 shrink-0">
                            <Menu className="h-6 w-6" />
                            <span className="sr-only">Alternar menú de navegación</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[min(280px,85vw)] overflow-y-auto p-0 pt-8">
                        <SidebarContent />
                    </SheetContent>
                </Sheet>
            </div>
            <h1 className="min-w-0 text-base font-semibold leading-tight font-headline sm:text-xl">
                {getTitle()}
            </h1>
        </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-11 gap-2 rounded-full px-1.5">
            <Avatar className="h-9 w-9 border border-border">
              <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
              <AvatarFallback className="bg-secondary text-primary"><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <span className="hidden max-w-[9rem] truncate text-sm font-medium md:inline">{user?.displayName}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user?.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.documentNumber}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
