import Link from 'next/link';
import { Logo } from '@namo/ui';

const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#how', label: 'How it works' },
      { href: '#domains', label: 'What we track' },
      { href: '#why', label: 'Why Namo' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'For',
    links: [
      { href: '#domains', label: 'Parents' },
      { href: '#why', label: 'Pediatricians' },
      { href: '#why', label: 'Hospitals' },
      { href: '#why', label: 'Government programs' },
    ],
  },
  {
    title: 'Account',
    links: [
      { href: '/register', label: 'Create account' },
      { href: '/login', label: 'Sign in' },
    ],
  },
];

/** Public marketing footer with the medical-advice disclaimer. */
export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-sand-200 bg-sand-50">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Logo />
            <p className="mt-4 text-sm leading-relaxed text-ink-muted">
              Gentle, clinically grounded developmental check-ins for every child
              aged 0–6 — so no milestone goes unnoticed.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                {column.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink-muted transition hover:text-primary-600"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-sand-200 bg-sand-100 px-5 py-4">
          <p className="text-xs leading-relaxed text-ink-muted">
            <span className="font-semibold text-ink">A note on care:</span> Namo
            supports your parenting with developmental screening — it does not
            diagnose conditions or replace professional medical advice. Always
            share results and concerns with a qualified pediatrician.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-sand-200 pt-6 text-xs text-ink-soft sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Namo. Built with care for growing families.</p>
          <p className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" />
            Based on validated ASQ developmental screening methodology
          </p>
        </div>
      </div>
    </footer>
  );
}
