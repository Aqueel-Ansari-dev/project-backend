'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/button';
import { cn } from '../ui/cn';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/datasets', label: 'Dataset' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const authRoutes = useMemo(() => new Set(['/login', '/register']), []);
  const isAuthRoute = pathname ? authRoutes.has(pathname) : false;

  useEffect(() => {
    if (!loading && !isAuthenticated && !isAuthRoute) {
      router.replace('/login');
    }
  }, [isAuthenticated, isAuthRoute, loading, router]);

  if (isAuthRoute) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-950">
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="w-full max-w-lg space-y-8">{children}</div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          <p className="text-sm text-slate-400">Preparing your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-slate-200 lg:hidden"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              Beyla Sandbox
            </Link>
          </div>
          <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'transition-colors hover:text-white',
                  pathname === item.href ? 'text-white' : 'text-slate-400'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden items-center gap-4 sm:flex">
            <div className="text-right text-xs leading-tight">
              <p className="font-medium text-slate-200">{user?.email ?? 'guest@beyla.local'}</p>
              <p className="text-slate-400">{user?.companyName ?? 'SME dashboard'}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => signOut()}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-slate-800 bg-slate-950 lg:hidden">
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'block px-4 py-3 text-sm font-medium transition-colors',
                      pathname === item.href ? 'text-white' : 'text-slate-300'
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  className="block w-full px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-slate-900"
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                >
                  Sign out
                </button>
              </li>
            </ul>
          </nav>
        )}
      </header>
      <main className="flex-1 px-4 py-6 lg:px-6">
        <div className="space-y-8 pb-16 lg:pb-10">{children}</div>
      </main>
      <nav className="sticky bottom-0 z-40 border-t border-slate-800 bg-slate-950/80 backdrop-blur lg:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
                pathname === item.href ? 'text-white' : 'text-slate-400'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
