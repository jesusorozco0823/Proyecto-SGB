
// In a real application, this would be a full-fledged authentication context
// connected to Firebase Auth. For this prototype, we'll use a simplified
// version that reads the role from localStorage.

"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { mockUsers } from '@/lib/mock-data';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const userDocument = localStorage.getItem('userDocument');
    
    if (userDocument) {
      const currentUser = mockUsers.find(u => u.documentNumber === userDocument) || null;
      setUser(currentUser);
      setRole(currentUser?.role || null);
    } else if (pathname !== '/') {
        // If no role and not on login page, redirect
        router.push('/');
    }
    setLoading(false);
  }, [pathname, router]);

  const logout = () => {
    localStorage.removeItem('userDocument');
    setUser(null);
    setRole(null);
    router.push('/');
  };

  const value = { user, role, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
