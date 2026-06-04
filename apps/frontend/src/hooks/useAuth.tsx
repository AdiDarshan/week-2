import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponse } from '../api/types';

type AuthContextValue = {
  auth: LoginResponse | null;
  userId: string | null;          
  setAuth: (next: LoginResponse | null) => void;
  logout: () => void;             
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialAuth?: LoginResponse | null;
};

export function AuthProvider({ children, initialAuth = null }: AuthProviderProps) {
  const [auth, setAuth] = useState<LoginResponse | null>(initialAuth);

  const logout = useCallback(() => setAuth(null), []);

  const value = useMemo<AuthContextValue>(() => ({
    auth,
    userId: auth?.user.id ?? null,
    setAuth,
    logout,
  }), [auth, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx){
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
