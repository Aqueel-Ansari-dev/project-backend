'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    const domain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN;
    const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI;
    if (!domain || !clientId || !redirectUri) {
      return;
    }
    const scope = encodeURIComponent('email openid profile');
    const loginUrl = `${domain}/login?client_id=${clientId}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}`;
    window.location.assign(loginUrl);
  }, []);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-brand">Beyla</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">Redirecting to Cognito…</h1>
      <p className="mt-2 text-sm text-slate-400">If you are not redirected, verify the Cognito env variables.</p>
    </div>
  );
}
