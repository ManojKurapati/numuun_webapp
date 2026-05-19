import type { ReactNode } from 'react';
import Link from 'next/link';
import { Logo } from '@namo/ui';

const HIGHLIGHTS = [
  { emoji: '🪴', text: 'Age-matched check-ins from birth to six years' },
  { emoji: '💛', text: 'Warm, reassuring guidance — never a pass or fail' },
  { emoji: '🔒', text: 'Private and secure, with HIPAA-inspired care' },
];

/** Branded split layout for the sign-in and registration screens. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary-600 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="namo-dots absolute inset-0 opacity-50" aria-hidden="true" />
        <div
          className="absolute -left-20 -top-16 h-72 w-72 rounded-full bg-primary-400/50 blur-3xl animate-blob"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-gold-400/25 blur-3xl animate-blob"
          style={{ animationDelay: '-9s' }}
          aria-hidden="true"
        />

        <div className="relative">
          <Link href="/" aria-label="Namo home">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface text-base font-bold text-primary-600">
                N
              </span>
              <span className="text-xl font-semibold tracking-tight text-white">Namo</span>
            </span>
          </Link>
        </div>

        <div className="relative">
          <p className="text-3xl">🌷</p>
          <h2 className="mt-4 max-w-sm font-display text-3xl font-medium leading-tight tracking-tight text-white">
            A calmer, kinder way to follow your child&apos;s growth.
          </h2>
          <ul className="mt-8 space-y-3.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-center gap-3 text-sm text-primary-50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-500/70 text-base">
                  {item.emoji}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <figure className="relative rounded-2xl border border-primary-400/40 bg-primary-500/40 p-5 backdrop-blur-sm">
          <blockquote className="text-sm leading-relaxed text-white">
            “Namo gave me calm, clear answers — and the activity ideas actually
            work. It is the reassurance I didn&apos;t know I needed.”
          </blockquote>
          <figcaption className="mt-3 text-xs font-medium text-primary-100">
            Aisha R. · Parent of two
          </figcaption>
        </figure>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col items-center justify-center bg-sand-50 px-4 py-12 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
          </div>
          <div className="rounded-3xl border border-sand-200 bg-surface p-8 shadow-glow sm:p-10">
            <h1 className="font-display text-3xl font-medium tracking-tight text-ink">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>}
            <div className="mt-7">{children}</div>
          </div>
          {footer && <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>}
        </div>
      </main>
    </div>
  );
}
