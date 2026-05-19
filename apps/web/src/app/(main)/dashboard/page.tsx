'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Alert, Skeleton } from '@namo/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ageLabel } from '@/lib/format';

const AVATAR_TONES = [
  'bg-primary-100 text-primary-700',
  'bg-teal-100 text-teal-700',
  'bg-gold-400/20 text-gold-600',
  'bg-clay-400/20 text-clay-600',
  'bg-dusk-100 text-dusk-600',
];

const PLAY_IDEAS = [
  {
    emoji: '🪞',
    title: 'Mirror peek-a-boo',
    domain: 'Personal-Social',
    tone: 'bg-dusk-50 text-dusk-600',
    blurb: 'Sit at a mirror together and name who you see. Builds self-recognition and joyful connection.',
  },
  {
    emoji: '🥁',
    title: 'Pots & pans band',
    domain: 'Problem Solving',
    tone: 'bg-clay-400/15 text-clay-600',
    blurb: 'Let little hands tap and drum. Cause-and-effect discovery hiding inside happy noise.',
  },
  {
    emoji: '📚',
    title: 'Slow story time',
    domain: 'Communication',
    tone: 'bg-primary-50 text-primary-700',
    blurb: 'Read one picture book slowly, pausing to point and name. Early language grows here.',
  },
  {
    emoji: '🧺',
    title: 'Treasure basket',
    domain: 'Fine Motor',
    tone: 'bg-gold-400/15 text-gold-600',
    blurb: 'Fill a basket with safe everyday objects to grasp and explore at their own pace.',
  },
];

const DOMAIN_NOTES = [
  { emoji: '💬', name: 'Communication', blurb: 'Babbling, first words and understanding you.' },
  { emoji: '🤸', name: 'Gross Motor', blurb: 'Rolling, crawling, walking and climbing.' },
  { emoji: '✋', name: 'Fine Motor', blurb: 'Grasping, stacking and small precise skills.' },
  { emoji: '🧩', name: 'Problem Solving', blurb: 'Exploring and working things out.' },
  { emoji: '🧸', name: 'Personal-Social', blurb: 'Playing, feelings and independence.' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  const [greeting, setGreeting] = useState('Hello');
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  const {
    data: children,
    isLoading,
    isError,
  } = useQuery({ queryKey: ['children'], queryFn: () => api().listChildren() });

  const hasChildren = Boolean(children && children.length > 0);

  return (
    <div className="space-y-12">
      {/* Greeting hero */}
      <section className="relative overflow-hidden rounded-3xl border border-sand-200 bg-surface p-7 shadow-soft sm:p-9">
        <div
          className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-primary-100/70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-teal-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              {greeting}
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Hello, {firstName} 🌼
            </h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
              Follow each child&apos;s development with gentle, regular check-ins —
              and celebrate every milestone along the way.
            </p>
          </div>
          <Link
            href="/children/new"
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-glow-primary transition hover:bg-primary-600 hover:shadow-glow-lg"
          >
            <span className="text-base">＋</span> Add a child
          </Link>
        </div>
      </section>

      {/* Children */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Your children
          </h2>
          {hasChildren && (
            <span className="rounded-full bg-sand-200 px-3 py-1 text-xs font-medium text-ink-muted">
              {children?.length} tracked
            </span>
          )}
        </div>

        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        )}

        {isError && <Alert variant="error">We couldn&apos;t load your children just now.</Alert>}

        {children && children.length === 0 && (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-sand-300 bg-surface px-6 py-14 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-3xl">
              🌱
            </div>
            <p className="mt-4 text-lg font-semibold text-ink">Add your first child</p>
            <p className="mt-1 max-w-sm text-sm text-ink-muted">
              Create a profile and Namo will match the right age-appropriate check-in
              to begin tracking developmental milestones.
            </p>
            <Link
              href="/children/new"
              className="mt-6 inline-flex h-12 items-center rounded-full bg-primary-500 px-6 text-sm font-semibold text-white shadow-glow-primary transition hover:bg-primary-600"
            >
              Add a child
            </Link>
          </div>
        )}

        {children && children.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {children.map((child, i) => (
              <Link key={child.id} href={`/children/${child.id}`} className="group">
                <div className="flex h-full items-center gap-4 rounded-3xl border border-sand-200 bg-surface p-6 shadow-soft transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-glow-lg">
                  <span
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-semibold ${
                      AVATAR_TONES[i % AVATAR_TONES.length]
                    }`}
                  >
                    {child.firstName.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-semibold text-ink">
                      {child.firstName} {child.lastName ?? ''}
                    </p>
                    <p className="text-sm text-ink-muted">{ageLabel(child.ageMonths)}</p>
                  </div>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-100 text-ink-soft transition group-hover:bg-primary-100 group-hover:text-primary-700">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m9 6 6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}

            <Link href="/children/new" className="group">
              <div className="flex h-full min-h-32 items-center justify-center gap-2 rounded-3xl border border-dashed border-sand-300 text-sm font-semibold text-ink-muted transition group-hover:border-primary-300 group-hover:bg-surface group-hover:text-primary-600">
                <span className="text-lg">＋</span> Add another child
              </div>
            </Link>
          </div>
        )}
      </section>

      {/* Play ideas */}
      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Play ideas for this week
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Simple, screen-free activities that support development through everyday play.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLAY_IDEAS.map((idea) => (
            <div
              key={idea.title}
              className="flex gap-4 rounded-3xl border border-sand-200 bg-surface p-5 shadow-soft"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sand-100 text-2xl">
                {idea.emoji}
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-ink">{idea.title}</p>
                  <span className={`rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${idea.tone}`}>
                    {idea.domain}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{idea.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Domain explainer */}
      <section className="space-y-5">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
            The five areas Namo follows
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Each check-in looks gently across these developmental domains.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAIN_NOTES.map((domain) => (
            <div
              key={domain.name}
              className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-surface p-4"
            >
              <span className="text-xl">{domain.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-ink">{domain.name}</p>
                <p className="text-xs leading-relaxed text-ink-muted">{domain.blurb}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Reassurance */}
      <Alert variant="info">
        Namo supports your parenting with developmental screening — it never diagnoses
        or replaces professional care. Share any concerns with your pediatrician.
      </Alert>
    </div>
  );
}
