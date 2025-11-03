'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LogOut, LogIn } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../../lib/auth-context';
import { Button } from '../ui/button';
import { cn } from '../ui/cn';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isAuthenticated, loading, signIn, signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

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
          <div className="flex items-center gap-3">
            {!loading && isAuthenticated && (
              <div className="hidden text-right text-xs leading-tight sm:block">
                <p className="font-medium text-slate-200">{user?.email ?? 'Authenticated'}</p>
                <p className="text-slate-400">Token active</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (isAuthenticated ? signOut() : signIn())}
              className="flex items-center gap-2"
            >
              {isAuthenticated ? (
                <>
                  <LogOut className="h-4 w-4" />
                  Sign out
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              )}
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
            </ul>
          </nav>
        )}
      </header>
      <main className="flex-1 px-4 py-6 lg:px-6">
        {!loading && !isAuthenticated ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <h1 className="text-2xl font-semibold text-white">Welcome to the Beyla sandbox</h1>
            <p className="mt-3 max-w-md text-sm text-slate-400">
              Sign in with your Cognito credentials to view account balances, manage transactions, and review agent alerts.
            </p>
            <Button className="mt-6" onClick={() => signIn()}>
              Sign in to continue
            </Button>
          </div>
        ) : (
          <div className="space-y-8 pb-16 lg:pb-10">
            {children}
          </div>
        )}
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
