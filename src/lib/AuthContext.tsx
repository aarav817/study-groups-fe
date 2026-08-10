'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  messaging_code?: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  loading: true,
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await api.auth.me();
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [pathname]);

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      // ignore
    } finally {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
