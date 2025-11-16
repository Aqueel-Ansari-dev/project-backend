'use client';

import { useState } from 'react';

import { useAuth } from '../../lib/auth-context';
import { useRequireAuth } from '../../lib/use-require-auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input, Label } from '../../components/ui/input';

export default function SettingsPage() {
  const { isAuthenticated, loading: authLoading } = useRequireAuth();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(
    [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || ''
  );
  const [company, setCompany] = useState(user?.companyName ?? '');
  const [timezone, setTimezone] = useState('UTC');
  const [message, setMessage] = useState<string | undefined>();

  if (authLoading && !isAuthenticated) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-slate-400">Future-ready profile preferences for operators.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              setMessage('Preferences saved locally. Wire this up to the backend when ready.');
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={user?.email ?? ''} disabled />
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Beyla" />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} placeholder="UTC" />
              </div>
            </div>
            {message && <p className="text-sm text-emerald-300">{message}</p>}
            <Button type="submit" className="w-full sm:w-auto">
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
