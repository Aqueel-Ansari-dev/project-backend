'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

type AuthUser = {
  email?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
};

type AuthContextValue = {
  isAuthenticated: boolean;
  loading: boolean;
  user?: AuthUser;
  tokens?: undefined;
  signIn: () => void;
  signOut: () => void;
  setTokens: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const email = process.env.NEXT_PUBLIC_SANDBOX_USER_EMAIL ?? 'demo@beyla.local';
  const displayName = process.env.NEXT_PUBLIC_SANDBOX_USER_NAME ?? 'Sandbox User';
  const [givenName, ...rest] = displayName.split(' ');
  const familyName = rest.join(' ') || undefined;

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: true,
    loading: false,
    user: {
      email,
      given_name: givenName || displayName,
      family_name: familyName,
      name: displayName,
    },
    signIn: () => {
      /* no-op in sandbox mode */
    },
    signOut: () => {
      /* no-op in sandbox mode */
    },
    setTokens: () => {
      /* no-op in sandbox mode */
    },
  }), [displayName, email, familyName, givenName]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
