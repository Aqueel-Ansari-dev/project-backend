'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

const AUTH_STORAGE_KEY = 'beyla.sandbox.session';

type GlobalBase64 = {
  atob?: (value: string) => string;
  Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } };
};

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  const globalRef = globalThis as unknown as GlobalBase64;
  if (typeof globalRef.atob === 'function') {
    return globalRef.atob(padded);
  }
  if (globalRef.Buffer) {
    return globalRef.Buffer.from(padded, 'base64').toString('utf8');
  }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of padded) {
    if (char === '=') break;
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    buffer = (buffer << 6) | index;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

interface AuthTokens {
  accessToken: string;
  idToken: string;
  expiresAt: number;
  refreshToken?: string;
}

interface AuthUser {
  sub?: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  [key: string]: unknown;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  loading: boolean;
  tokens?: AuthTokens;
  user?: AuthUser;
  signIn: () => void;
  signOut: () => void;
  setTokens: (tokens?: AuthTokens, user?: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeJwt(token: string): AuthUser | undefined {
  try {
    const payload = token.split('.')[1];
    if (!payload) return undefined;
    const decoded = decodeBase64Url(payload);
    return JSON.parse(decoded);
  } catch (err) {
    console.warn('Failed to decode token', err);
    return undefined;
  }
}

function parseFragment(fragment: string): Record<string, string> {
  return fragment
    .replace(/^#/, '')
    .split('&')
    .map((pair) => pair.split('='))
    .reduce<Record<string, string>>((acc, [key, value]) => {
      if (key) acc[decodeURIComponent(key)] = decodeURIComponent(value ?? '');
      return acc;
    }, {});
}

function getConfig() {
  const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
  const logoutUri = process.env.NEXT_PUBLIC_COGNITO_LOGOUT_URI ?? redirectUri;
  if (!domain || !clientId || !redirectUri) {
    console.warn('Cognito environment variables are missing. Authentication will be disabled.');
  }
  return { domain, clientId, redirectUri, logoutUri };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [{ loading, tokens, user }, setState] = useState<{
    loading: boolean;
    tokens?: AuthTokens;
    user?: AuthUser;
  }>({ loading: true });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let initialTokens: AuthTokens | undefined;
    try {
      const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed: AuthTokens = JSON.parse(stored);
        if (parsed.expiresAt > Date.now()) {
          initialTokens = parsed;
        }
      }
    } catch (err) {
      console.warn('Unable to read stored session', err);
    }

    const fragment = window.location.hash;
    if (fragment?.includes('id_token')) {
      const params = parseFragment(fragment);
      if (params.id_token && params.access_token && params.expires_in) {
        const expiresAt = Date.now() + Number(params.expires_in) * 1000;
        initialTokens = {
          accessToken: params.access_token,
          idToken: params.id_token,
          expiresAt,
          refreshToken: params.refresh_token,
        };
        try {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(initialTokens));
        } catch (err) {
          console.warn('Unable to persist session', err);
        }
      }
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }

    setState({
      loading: false,
      tokens: initialTokens,
      user: initialTokens ? decodeJwt(initialTokens.idToken) : undefined,
    });
  }, []);

  const setTokens = useCallback((nextTokens?: AuthTokens, nextUser?: AuthUser) => {
    setState({ loading: false, tokens: nextTokens, user: nextUser });
    if (typeof window === 'undefined') return;
    try {
      if (nextTokens) {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextTokens));
      } else {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to persist session', err);
    }
  }, []);

  const signIn = useCallback(() => {
    const { domain, clientId, redirectUri } = getConfig();
    if (!domain || !clientId || !redirectUri) return;
    const url = new URL(`https://${domain}/oauth2/authorize`);
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'openid profile email');
    window.location.assign(url.toString());
  }, []);

  const signOut = useCallback(() => {
    const { domain, clientId, logoutUri } = getConfig();
    setTokens(undefined, undefined);
    if (!domain || !clientId || !logoutUri) return;
    const url = new URL(`https://${domain}/logout`);
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('logout_uri', logoutUri);
    window.location.assign(url.toString());
  }, [setTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(tokens?.accessToken),
      loading,
      tokens,
      user,
      signIn,
      signOut,
      setTokens,
    }),
    [loading, tokens, user, signIn, signOut, setTokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
