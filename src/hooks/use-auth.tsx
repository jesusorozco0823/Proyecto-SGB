"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { User, UserRole } from '@/lib/types';
import { apiClient } from '@/lib/api-client';
import { canAccess } from '@/lib/access';

interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    const current = await apiClient.get<User>('/api/v1/auth/me');
    setUser(current);
    setRole(current.role);
  }, []);

  useEffect(() => {
    let active = true;
    apiClient
      .get<User>('/api/v1/auth/me')
      .then((current) => {
        if (!active) return;
        setUser(current);
        setRole(current.role);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        setRole(null);
        router.replace('/');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (loading || !role) return;
    if (!canAccess(role, pathname)) {
      router.replace('/dashboard');
    }
  }, [loading, role, pathname, router]);

  const logout = () => {
    void apiClient.post('/api/v1/auth/logout').finally(() => {
      setUser(null);
      setRole(null);
      router.push('/');
    });
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout, refresh }}>
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
