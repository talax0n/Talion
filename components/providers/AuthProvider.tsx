'use client';
import { useSession } from '@/lib/auth-client';
import { createContext, useContext } from 'react';

interface AuthContextValue {
  session: ReturnType<typeof useSession>['data'];
  isPending: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, isPending: true });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  return (
    <AuthContext.Provider value={{ session, isPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
