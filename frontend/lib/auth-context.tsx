'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setApiAuthToken } from './api';
const STORAGE_KEY = 'beyla-auth';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companyRegNumber: string;
  sector?: string | null;
}

interface StoredAuth {
  token: string;
  user: AuthUser;
  expiresAt?: number;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
  user: AuthUser;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  token?: string;
  user?: AuthUser;
  setAuthFromBackend: (response: AuthResponse) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAuth;
    if (!parsed.token || !parsed.user) {
      return null;
    }
    if (parsed.expiresAt && parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistAuth(auth: StoredAuth | null) {
  if (typeof window === 'undefined') {
    return;
  }
  if (!auth) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | undefined>();
  const [user, setUser] = useState<AuthUser | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setToken(stored.token);
      setUser(stored.user);
      setApiAuthToken(stored.token);
    } else {
      setApiAuthToken(null);
    }
    setLoading(false);
  }, []);

  const applyAuth = useCallback((response: AuthResponse) => {
    const expiresAt = Date.now() + response.expiresIn * 1000;
    setToken(response.token);
    setUser(response.user);
    setApiAuthToken(response.token);
    persistAuth({ token: response.token, user: response.user, expiresAt });
  }, []);

  const setAuthFromBackend = useCallback(
    (response: AuthResponse) => {
      applyAuth(response);
    },
    [applyAuth]
  );

  const signOut = useCallback(() => {
    setToken(undefined);
    setUser(undefined);
    setApiAuthToken(null);
    persistAuth(null);
    if (typeof window === 'undefined') {
      return;
    }
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri =
      process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI ?? window.location.origin;
    if (domain && clientId) {
      const logoutUrl = `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(redirectUri)}`;
      window.location.assign(logoutUrl);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      loading,
      token,
      user,
      setAuthFromBackend,
      signOut,
    }),
    [loading, setAuthFromBackend, signOut, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
