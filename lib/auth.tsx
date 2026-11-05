import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

import { api, TOKEN_KEY } from '@/lib/api';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const response = await api<{ user: AuthUser }>('/api/auth/me');
      setUser(response.user);
    } catch {
      setUser(null);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await api<{ user: AuthUser; token?: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    if (response.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    }

    setUser(response.user);
  };

  const signUp = async (name: string, email: string, password: string) => {
    const response = await api<{ user: AuthUser; token?: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });

    if (response.token) {
      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
    }

    setUser(response.user);
  };

  const signOut = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout failures and still clear the local token.
    }

    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
