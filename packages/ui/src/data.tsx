import type { ReactNode } from 'react';
import { Card, CardBody } from './card';
import { cn } from './cn';

/** Thick, pill-shaped progress bar. */
export function ProgressBar({
  value,
  max,
  tone = 'teal',
  className,
}: {
  value: number;
  max: number;
  tone?: 'teal' | 'primary';
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={cn('h-3 w-full overflow-hidden rounded-full bg-sand-200', className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500',
          tone === 'primary' ? 'bg-primary-500' : 'bg-teal-500',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Compact metric card for dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-1 text-3xl font-semibold text-ink">{value}</p>
          {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-xl">
            {icon}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

/** Page title block with optional description and actions. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/** Namo wordmark. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-base font-bold text-white">
        N
      </span>
      <span className="text-xl font-semibold tracking-tight text-ink">Namo</span>
    </span>
  );
}
