import type { JSX, ReactNode } from 'react';
import { cn } from './cn';

/** Animated loading spinner. Inherits text color. */
export function Spinner({ className }: { className?: string }): JSX.Element {
  return (
    <svg
      className={cn('animate-spin', className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export type BadgeTone = 'neutral' | 'primary' | 'teal' | 'gold' | 'clay';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-sand-200 text-ink-muted',
  primary: 'bg-primary-50 text-primary-700',
  teal: 'bg-teal-50 text-teal-700',
  gold: 'bg-gold-400/15 text-gold-600',
  clay: 'bg-clay-400/15 text-clay-600',
};

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export type Zone = 'NORMAL' | 'GREY_ZONE' | 'DELAY';

const ZONE_META: Record<Zone, { label: string; tone: BadgeTone }> = {
  NORMAL: { label: 'On Track', tone: 'teal' },
  GREY_ZONE: { label: 'Keep Watching', tone: 'gold' },
  DELAY: { label: 'Needs Support', tone: 'clay' },
};

/** Reassuring, parent-friendly label for a developmental zone. */
export function ZoneBadge({ zone }: { zone: Zone }): JSX.Element {
  const meta = ZONE_META[zone];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const ALERT_STYLES: Record<AlertVariant, string> = {
  info: 'bg-teal-50 border-teal-100 text-teal-800',
  success: 'bg-teal-50 border-teal-100 text-teal-800',
  warning: 'bg-gold-400/12 border-gold-400/30 text-gold-600',
  error: 'bg-clay-400/12 border-clay-400/30 text-clay-600',
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', ALERT_STYLES[variant], className)}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cn(title && 'mt-0.5')}>{children}</div>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-sand-300 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sand-200 text-2xl">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }): JSX.Element {
  return <div className={cn('animate-pulse rounded-lg bg-sand-200', className)} />;
}
