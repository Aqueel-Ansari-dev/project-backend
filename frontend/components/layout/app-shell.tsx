'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useAuth } from '../../lib/auth-context';
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
  const { user } = useAuth();
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
          <div className="hidden text-right text-xs leading-tight sm:block">
            <p className="font-medium text-slate-200">{user?.email ?? 'sandbox@beyla.local'}</p>
            <p className="text-slate-400">Sandbox mode active</p>
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
