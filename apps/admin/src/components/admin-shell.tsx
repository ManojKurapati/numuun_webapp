'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn, Logo } from '@namo/ui';
import { useAuth } from '@/lib/auth';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/questionnaires', label: 'Questionnaires' },
  { href: '/children', label: 'Children' },
  { href: '/assessments', label: 'Assessments' },
  { href: '/users', label: 'Users' },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isActive = (href: string): boolean =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <div className="min-h-screen lg:pl-60">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sand-200 bg-surface px-4 py-6 lg:flex">
        <Link href="/" className="px-2">
          <Logo />
        </Link>
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive(item.href)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-muted hover:bg-sand-100',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-sand-200 pt-4">
          <p className="truncate px-3 text-sm font-medium text-ink">{user?.fullName}</p>
          <p className="px-3 text-xs text-ink-soft">Administrator</p>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-sand-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <header className="flex h-16 items-center justify-between border-b border-sand-200 bg-surface px-6 lg:hidden">
        <Logo />
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-medium text-ink-muted"
        >
          Sign out
        </button>
      </header>

      {/* Horizontal nav for narrow screens. */}
      <nav className="flex gap-1 overflow-x-auto border-b border-sand-200 bg-surface px-4 py-2 lg:hidden">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium',
              isActive(item.href) ? 'bg-primary-50 text-primary-700' : 'text-ink-muted',
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
