'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { PublicUser } from '@namo/api-client';
import type { RegisterInput } from '@namo/validation';
import { api } from './api';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: PublicUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api()
      .me()
      .then((current) => {
        if (active) {
          setUser(current);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setStatus('unauthenticated');
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api().login({ email, password });
    setUser(result.user);
    setStatus('authenticated');
  };

  const register = async (input: RegisterInput) => {
    const result = await api().register(input);
    setUser(result.user);
    setStatus('authenticated');
  };

  const logout = async () => {
    await api().logout();
    setUser(null);
    setStatus('unauthenticated');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, status, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
