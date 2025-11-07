'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { setApiAuthToken } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
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

interface SignInPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends SignInPayload {
  firstName: string;
  lastName: string;
  companyName: string;
  companyRegNumber: string;
  sector?: string;
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
  signIn: (payload: SignInPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function requestAuth(path: string, body: unknown): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed?.message) {
        throw new Error(parsed.message);
      }
    } catch {
      if (text.trim()) {
        throw new Error(text);
      }
    }
    throw new Error('Authentication request failed');
  }

  const json = (await response.json()) as { data: AuthResponse };
  return json.data;
}

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

  const signIn = useCallback(
    async (payload: SignInPayload) => {
      const result = await requestAuth('/auth/login', payload);
      applyAuth(result);
    },
    [applyAuth]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const result = await requestAuth('/auth/register', payload);
      applyAuth(result);
    },
    [applyAuth]
  );

  const signOut = useCallback(() => {
    setToken(undefined);
    setUser(undefined);
    setApiAuthToken(null);
    persistAuth(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      loading,
      token,
      user,
      signIn,
      register,
      signOut,
    }),
    [loading, register, signIn, signOut, token, user]
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
