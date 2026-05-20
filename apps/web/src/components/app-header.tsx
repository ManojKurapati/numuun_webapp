'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@namo/ui';
import { useAuth } from '@/lib/auth';

const NAV = [{ href: '/dashboard', label: 'Home' }];

/** Sticky top bar for authenticated parent screens. */
export function AppHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const initials = user?.fullName
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="namo-glass sticky top-0 z-30 border-b border-white/40">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" aria-label="Namo home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-ink-muted hover:bg-sand-200 hover:text-ink'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                {initials}
              </span>
              <span className="hidden text-sm font-medium text-ink sm:block">
                {user.fullName}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-sand-200 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
