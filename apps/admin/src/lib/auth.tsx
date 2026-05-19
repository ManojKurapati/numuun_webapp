'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, type PublicUser } from '@namo/api-client';
import { api } from './api';

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: PublicUser | null;
  status: Status;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Admin sessions are restricted to users with the ADMIN role. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api()
      .me()
      .then((current) => {
        if (!active) return;
        if (current.role === 'ADMIN') {
          setUser(current);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
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
    if (result.user.role !== 'ADMIN') {
      await api().logout();
      throw new ApiError('NOT_ADMIN', 'This account does not have administrator access.', 403);
    }
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
    <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
