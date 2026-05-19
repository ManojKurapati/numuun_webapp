'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Logo } from '@namo/ui';
import { useAuth } from '@/lib/auth';

const NAV_LINKS = [
  { href: '#how', label: 'How it works' },
  { href: '#domains', label: 'What we track' },
  { href: '#why', label: 'Why Namo' },
  { href: '#faq', label: 'FAQ' },
];

/** Public, marketing-site top navigation with a scroll-aware backdrop. */
export function MarketingHeader() {
  const { status } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isAuthed = status === 'authenticated';

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-300 ${
          scrolled
            ? 'border-b border-sand-200/70 bg-sand-50/85 backdrop-blur-md'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" aria-label="Namo home" className="shrink-0">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-sand-200/70 hover:text-ink"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {isAuthed ? (
              <Link
                href="/dashboard"
                className="inline-flex h-11 items-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-glow-primary transition hover:bg-primary-600 hover:shadow-glow-lg"
              >
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold text-ink-muted transition hover:bg-sand-200/70 hover:text-ink"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-glow-primary transition hover:bg-primary-600 hover:shadow-glow-lg"
                >
                  Get started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition hover:bg-sand-200/70 sm:hidden"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {menuOpen ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-b border-sand-200 bg-sand-50/95 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-ink transition hover:bg-sand-200/70"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {isAuthed ? (
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white"
                >
                  Go to dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center rounded-full border border-sand-300 text-sm font-semibold text-ink"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/register"
                    className="inline-flex h-12 items-center justify-center rounded-full bg-primary-500 text-sm font-semibold text-white"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
