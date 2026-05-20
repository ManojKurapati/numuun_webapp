'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { cn, Logo } from '@namo/ui';
import { useAuth } from '@/lib/auth';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/', label: 'Dashboard', icon: <DashboardIcon /> },
      { href: '/system', label: 'System Ops', icon: <ServerIcon /> },
    ],
  },
  {
    label: 'Children',
    items: [
      { href: '/children', label: 'Search & Profiles', icon: <UserIcon /> },
      { href: '/children/high-risk', label: 'High-Risk Queue', icon: <AlertIcon /> },
      { href: '/referrals', label: 'Referrals', icon: <ArrowRightCircleIcon /> },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { href: '/assessments', label: 'Assessment Library', icon: <ClipboardIcon /> },
      { href: '/questionnaires', label: 'Questionnaires', icon: <ListIcon /> },
      { href: '/uploads', label: 'AI Extraction Review', icon: <SparklesIcon /> },
    ],
  },
  {
    label: 'Interventions',
    items: [
      { href: '/interventions', label: 'Video Library', icon: <PlayIcon /> },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/analytics', label: 'Population Insights', icon: <ChartIcon /> },
      { href: '/reports', label: 'Reports', icon: <DocumentIcon /> },
    ],
  },
  {
    label: 'Communication',
    items: [
      { href: '/campaigns', label: 'Campaigns', icon: <MegaphoneIcon /> },
    ],
  },
  {
    label: 'Organization',
    items: [
      { href: '/users', label: 'Users & Roles', icon: <UsersIcon /> },
      { href: '/audit', label: 'Audit Log', icon: <ShieldIcon /> },
    ],
  },
];

const FLAT = SECTIONS.flatMap((section) => section.items);

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  if (pathname === href) return true;
  return pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-sand-100 lg:pl-64">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-64 flex-col border-r border-sand-200 bg-surface px-3 py-5 transition-transform lg:flex',
          mobileOpen ? 'flex translate-x-0' : 'hidden -translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex items-center justify-between px-2">
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Logo />
          </Link>
          <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-primary-700">
            Admin
          </span>
        </div>

        <nav className="mt-6 flex-1 overflow-y-auto pr-1">
          {SECTIONS.map((section) => (
            <div key={section.label} className="mb-5">
              <p className="px-3 text-[0.65rem] font-semibold uppercase tracking-wider text-ink-soft">
                {section.label}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition',
                          active
                            ? 'bg-primary-50 text-primary-700'
                            : 'text-ink-muted hover:bg-sand-100',
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-5 w-5 items-center justify-center',
                            active ? 'text-primary-600' : 'text-ink-soft',
                          )}
                        >
                          {item.icon}
                        </span>
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-sand-200 pt-3">
          <div className="px-3">
            <p className="truncate text-sm font-medium text-ink">{user?.fullName}</p>
            <p className="truncate text-xs text-ink-soft">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="mt-2 w-full rounded-xl px-3 py-2 text-left text-sm text-ink-muted transition hover:bg-sand-100"
          >
            Sign out
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-sand-200 bg-surface/95 px-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle navigation"
          className="rounded-xl p-2 text-ink-muted hover:bg-sand-100"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M3 6h14M3 10h14M3 14h14" />
          </svg>
        </button>
        <Logo />
        <button
          type="button"
          onClick={() => void logout()}
          className="text-sm font-medium text-ink-muted"
        >
          Sign out
        </button>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CurrentCrumb pathname={pathname} />
        {children}
      </main>
    </div>
  );
}

function CurrentCrumb({ pathname }: { pathname: string }) {
  const current = FLAT.find((item) => isActive(pathname, item.href));
  if (!current || current.href === '/') return null;
  return (
    <nav className="mb-4 flex items-center gap-1.5 text-xs text-ink-soft" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-ink">
        Admin
      </Link>
      <span>›</span>
      <span className="text-ink">{current.label}</span>
    </nav>
  );
}

// ---- Icons (inline for zero dependencies, theme-aware via currentColor) ----

function IconWrap({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return (
    <IconWrap>
      <rect x="3" y="3" width="6" height="6" rx="1.4" />
      <rect x="11" y="3" width="6" height="3" rx="1.4" />
      <rect x="11" y="8" width="6" height="9" rx="1.4" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" />
    </IconWrap>
  );
}
function ServerIcon() {
  return (
    <IconWrap>
      <rect x="3" y="3" width="14" height="6" rx="1.4" />
      <rect x="3" y="11" width="14" height="6" rx="1.4" />
      <circle cx="6.5" cy="6" r="0.6" fill="currentColor" />
      <circle cx="6.5" cy="14" r="0.6" fill="currentColor" />
    </IconWrap>
  );
}
function UserIcon() {
  return (
    <IconWrap>
      <circle cx="10" cy="7" r="3" />
      <path d="M3.5 17c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    </IconWrap>
  );
}
function UsersIcon() {
  return (
    <IconWrap>
      <circle cx="8" cy="8" r="3" />
      <circle cx="15" cy="9" r="2" />
      <path d="M2 17c0-3 2.7-5 6-5s6 2 6 5" />
      <path d="M14 17c0-2 1.6-3.6 3-3.6" />
    </IconWrap>
  );
}
function AlertIcon() {
  return (
    <IconWrap>
      <path d="M10 3l8 14H2z" strokeLinejoin="round" />
      <path d="M10 8v4" strokeLinecap="round" />
      <circle cx="10" cy="14.5" r="0.6" fill="currentColor" />
    </IconWrap>
  );
}
function ArrowRightCircleIcon() {
  return (
    <IconWrap>
      <circle cx="10" cy="10" r="7" />
      <path d="M8 7l3 3-3 3" strokeLinejoin="round" strokeLinecap="round" />
    </IconWrap>
  );
}
function ClipboardIcon() {
  return (
    <IconWrap>
      <rect x="5" y="4" width="10" height="13" rx="1.6" />
      <rect x="7.5" y="2.5" width="5" height="3" rx="0.8" />
    </IconWrap>
  );
}
function ListIcon() {
  return (
    <IconWrap>
      <path d="M6 5h11M6 10h11M6 15h11" strokeLinecap="round" />
      <circle cx="3" cy="5" r="0.8" fill="currentColor" />
      <circle cx="3" cy="10" r="0.8" fill="currentColor" />
      <circle cx="3" cy="15" r="0.8" fill="currentColor" />
    </IconWrap>
  );
}
function SparklesIcon() {
  return (
    <IconWrap>
      <path d="M10 3v3M10 14v3M3 10h3M14 10h3" strokeLinecap="round" />
      <path d="M10 6.5l1.4 2.1 2.1 1.4-2.1 1.4-1.4 2.1-1.4-2.1-2.1-1.4 2.1-1.4z" strokeLinejoin="round" />
    </IconWrap>
  );
}
function PlayIcon() {
  return (
    <IconWrap>
      <circle cx="10" cy="10" r="7" />
      <path d="M8.5 7.5l4 2.5-4 2.5z" fill="currentColor" stroke="none" />
    </IconWrap>
  );
}
function ChartIcon() {
  return (
    <IconWrap>
      <path d="M3 16h14" strokeLinecap="round" />
      <rect x="4" y="9" width="3" height="6" rx="0.6" />
      <rect x="9" y="5" width="3" height="10" rx="0.6" />
      <rect x="14" y="11" width="3" height="4" rx="0.6" />
    </IconWrap>
  );
}
function DocumentIcon() {
  return (
    <IconWrap>
      <path d="M5 3h7l3 3v11H5z" strokeLinejoin="round" />
      <path d="M12 3v3h3" strokeLinejoin="round" />
      <path d="M8 11h4M8 14h4" strokeLinecap="round" />
    </IconWrap>
  );
}
function MegaphoneIcon() {
  return (
    <IconWrap>
      <path d="M3 8l11-4v12L3 12z" strokeLinejoin="round" />
      <path d="M14 7v6" />
      <path d="M6 12v3a2 2 0 0 0 4 0" />
    </IconWrap>
  );
}
function ShieldIcon() {
  return (
    <IconWrap>
      <path d="M10 3l6 2v5c0 4-3 6.5-6 7-3-0.5-6-3-6-7V5z" strokeLinejoin="round" />
      <path d="M7.5 10.5l2 2 3.5-3.5" strokeLinecap="round" strokeLinejoin="round" />
    </IconWrap>
  );
}
