'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '../../../lib/auth-context';

export default function AuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const { setAuthFromBackend } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      return;
    }
    const run = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/callback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ code }),
        });
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || 'Failed to complete sign-in');
        }
        const json = (await response.json()) as {
          data: { token: string; expiresIn: number; user: { id: string } };
        };
        setAuthFromBackend(json.data);
        router.replace('/');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to complete sign-in');
      }
    };

    run();
  }, [params, router, setAuthFromBackend]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-brand">Beyla</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">Signing you in…</h1>
      <p className="mt-2 text-sm text-slate-400">Processing your Cognito login.</p>
      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
