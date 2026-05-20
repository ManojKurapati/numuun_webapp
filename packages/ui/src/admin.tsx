/**
 * Admin-density UI primitives — designed for data-rich operational surfaces.
 *
 * Parent-facing pages use the warm, sparse cards from `data.tsx`. Admin pages
 * need denser, scannable patterns: data tables, KPI strips, filter bars,
 * detail drawers, sparklines and queue tiles. Everything here reuses the same
 * Desert Bloom design tokens so the platform still feels like one product.
 */
import type { ReactNode } from 'react';
import { cn } from './cn';
import { Badge, type BadgeTone, Spinner } from './feedback';
import { Card, CardBody } from './card';

// ---------- KPIs -----------------------------------------------------------

export interface KpiTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  delta?: { value: number; positiveIsGood?: boolean };
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
  icon?: ReactNode;
}

const TILE_TONES: Record<NonNullable<KpiTileProps['tone']>, string> = {
  neutral: 'border-sand-200 bg-surface',
  positive: 'border-teal-100 bg-teal-50/60',
  warning: 'border-gold-400/40 bg-gold-400/8',
  danger: 'border-clay-400/40 bg-clay-400/8',
};

/** Dense KPI tile for executive dashboards. */
export function KpiTile({
  label,
  value,
  hint,
  delta,
  tone = 'neutral',
  icon,
}: KpiTileProps) {
  const positive = delta ? (delta.positiveIsGood ?? true) === delta.value >= 0 : null;
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-soft',
        TILE_TONES[tone],
      )}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
        {(hint || delta) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {delta && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-semibold',
                  positive ? 'text-teal-600' : 'text-clay-600',
                )}
              >
                {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value).toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-ink-soft">{hint}</span>}
          </div>
        )}
      </div>
      {icon && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-base">
          {icon}
        </div>
      )}
    </div>
  );
}

export function KpiStrip({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

// ---------- Sparkline ------------------------------------------------------

/** Inline mini line chart for trend visualisations. */
export function Sparkline({
  points,
  width = 160,
  height = 40,
  tone = 'primary',
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  tone?: 'primary' | 'teal' | 'clay' | 'gold' | 'dusk';
  className?: string;
}) {
  if (points.length === 0) {
    return (
      <svg width={width} height={height} className={className} aria-hidden />
    );
  }
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;
  const stroke = `var(--color-${tone}-500)`;
  const fill = `var(--color-${tone}-50)`;

  const linePath = points
    .map((value, i) => {
      const x = i * stepX;
      const y = height - ((value - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden>
      <path d={areaPath} fill={fill} opacity={0.6} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ---------- Donut ----------------------------------------------------------

export interface DonutSlice {
  label: string;
  value: number;
  tone?: 'primary' | 'teal' | 'clay' | 'gold' | 'dusk' | 'sand';
}

const SLICE_TOKEN: Record<NonNullable<DonutSlice['tone']>, string> = {
  primary: 'var(--color-primary-500)',
  teal: 'var(--color-teal-500)',
  clay: 'var(--color-clay-500)',
  gold: 'var(--color-gold-500)',
  dusk: 'var(--color-dusk-500)',
  sand: 'var(--color-sand-400)',
};

/** Donut chart, sized via CSS class on the wrapping SVG. */
export function Donut({
  slices,
  size = 132,
  thickness = 18,
  center,
}: {
  slices: DonutSlice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth={thickness}
        />
        {total > 0 &&
          slices.map((slice, i) => {
            const portion = slice.value / total;
            const length = portion * circumference;
            const dashArray = `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`;
            const stroke = SLICE_TOKEN[slice.tone ?? 'primary'];
            const element = (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={stroke}
                strokeWidth={thickness}
                strokeDasharray={dashArray}
                strokeDashoffset={(-offset).toFixed(2)}
                strokeLinecap="butt"
              />
            );
            offset += length;
            return element;
          })}
      </svg>
      {center && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">{center}</div>
        </div>
      )}
    </div>
  );
}

// ---------- Bar / heatmap --------------------------------------------------

export function BarRow({
  label,
  value,
  max,
  tone = 'primary',
  hint,
}: {
  label: string;
  value: number;
  max: number;
  tone?: 'primary' | 'teal' | 'clay' | 'gold' | 'dusk';
  hint?: ReactNode;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="text-ink-muted">{label}</span>
        <span className="font-semibold text-ink">
          {value}
          {hint && <span className="ml-1 text-xs text-ink-soft">{hint}</span>}
        </span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-sand-200">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: `var(--color-${tone}-500)`,
          }}
        />
      </div>
    </div>
  );
}

// ---------- DataTable ------------------------------------------------------

export interface DataColumn<Row> {
  key: string;
  header: ReactNode;
  /** Make the cell scan-friendly by aligning numbers right. */
  align?: 'left' | 'right';
  /** Column width hint (CSS string). */
  width?: string;
  render: (row: Row) => ReactNode;
}

export interface DataTableProps<Row> {
  columns: DataColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  onRowClick?: (row: Row) => void;
  empty?: ReactNode;
  loading?: boolean;
  /** Optional dense mode reduces vertical padding for ops tables. */
  dense?: boolean;
}

/** Admin-density table primitive. Strong header, hoverable rows, click anywhere. */
export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  loading,
  dense,
}: DataTableProps<Row>) {
  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-sand-200 bg-surface py-16">
        <Spinner className="h-6 w-6 text-primary-500" />
      </div>
    );
  }
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-sand-300 bg-surface px-6 py-12 text-center text-sm text-ink-muted">
        {empty ?? 'No results.'}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 bg-surface shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-sand-100/60">
            <tr className="text-left text-xs uppercase tracking-wide text-ink-soft">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 font-medium',
                    dense ? 'py-2.5' : 'py-3',
                    col.align === 'right' && 'text-right',
                  )}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-t border-sand-200 transition',
                  onRowClick && 'cursor-pointer hover:bg-sand-100/50',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 text-ink',
                      dense ? 'py-2.5' : 'py-3.5',
                      col.align === 'right' && 'text-right tabular-nums',
                    )}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- FilterBar ------------------------------------------------------

export function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-sand-200 bg-surface px-3 py-2.5 shadow-soft">
      {children}
    </div>
  );
}

// ---------- DetailDrawer ---------------------------------------------------

export function DetailDrawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  width = 'max-w-xl',
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close drawer"
        onClick={onClose}
        className="grow bg-ink/40 backdrop-blur-sm"
      />
      <aside
        className={cn(
          'flex w-full flex-col overflow-hidden bg-surface shadow-float',
          width,
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-sand-200 px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-ink-muted hover:bg-sand-100"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </header>
        <div className="grow overflow-y-auto px-6 py-5 text-sm text-ink">{children}</div>
        {footer && <footer className="border-t border-sand-200 bg-sand-50/40 px-6 py-3">{footer}</footer>}
      </aside>
    </div>
  );
}

// ---------- Risk + status badges ------------------------------------------

const RISK_TONE: Record<string, BadgeTone> = {
  CRITICAL: 'clay',
  HIGH: 'gold',
  MEDIUM: 'primary',
  LOW: 'teal',
  NONE: 'neutral',
};

export function RiskBadge({ level }: { level: string }) {
  return <Badge tone={RISK_TONE[level] ?? 'neutral'}>{level}</Badge>;
}

const STATUS_TONE: Record<string, BadgeTone> = {
  OPEN: 'gold',
  ACCEPTED: 'primary',
  SCHEDULED: 'primary',
  COMPLETED: 'teal',
  CANCELLED: 'neutral',
  DRAFT: 'neutral',
  SENT: 'teal',
  PUBLISHED: 'teal',
  UPLOADED: 'neutral',
  PROCESSING: 'primary',
  EXTRACTED: 'primary',
  NEEDS_REVIEW: 'gold',
  APPROVED: 'teal',
  REJECTED: 'clay',
  UP: 'teal',
  DEGRADED: 'gold',
  DOWN: 'clay',
};

export function StatusBadge({ value }: { value: string }) {
  return <Badge tone={STATUS_TONE[value] ?? 'neutral'}>{value.replace(/_/g, ' ')}</Badge>;
}

// ---------- Section card ---------------------------------------------------

export function SectionCard({
  title,
  description,
  actions,
  children,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      {(title || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-sand-200 px-5 py-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-ink">{title}</h3>}
            {description && <p className="mt-0.5 text-xs text-ink-soft">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <CardBody>{children}</CardBody>
    </Card>
  );
}

// ---------- Queue tile -----------------------------------------------------

export function QueueTile({
  label,
  count,
  hint,
  tone = 'primary',
}: {
  label: string;
  count: number;
  hint?: string;
  tone?: 'primary' | 'teal' | 'clay' | 'gold' | 'dusk';
}) {
  return (
    <div className="rounded-2xl border border-sand-200 bg-surface p-4 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">{label}</p>
      <p
        className="mt-2 text-3xl font-semibold tracking-tight"
        style={{ color: `var(--color-${tone}-600)` }}
      >
        {count}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
