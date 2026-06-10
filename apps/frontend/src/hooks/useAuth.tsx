import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { LoginResponseDto } from '../api/types';

type AuthContextValue = {
  auth: LoginResponseDto | null;
  setAuth: (next: LoginResponseDto | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialAuth?: LoginResponseDto | null;
};

export function AuthProvider({ children, initialAuth = null }: AuthProviderProps) {
  const [auth, setAuth] = useState<LoginResponseDto | null>(initialAuth);

  const logout = useCallback(() => setAuth(null), []);

  const value = useMemo<AuthContextValue>(() => ({
    auth,
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
