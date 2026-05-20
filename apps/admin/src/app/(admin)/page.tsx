'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  BarRow,
  Donut,
  KpiStrip,
  KpiTile,
  PageHeader,
  QueueTile,
  SectionCard,
  Skeleton,
  Sparkline,
} from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

export default function ExecutiveDashboardPage() {
  const overviewQuery = useQuery({
    queryKey: ['admin-executive'],
    queryFn: () => api().adminExecutive(),
  });

  if (overviewQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Executive dashboard" description="Loading platform intelligence…" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (overviewQuery.isError || !overviewQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Executive dashboard" />
        <Alert variant="error">We couldn&apos;t load the executive dashboard.</Alert>
      </div>
    );
  }

  const data = overviewQuery.data;
  const trendPoints = data.assessmentsTrend.map((row) => row.count);
  const trend30Total = trendPoints.reduce((sum, n) => sum + n, 0);

  const totalZoneAssessments = Object.values(data.assessments.zoneDistribution).reduce(
    (sum, n) => sum + n,
    0,
  );
  const delays = data.assessments.zoneDistribution.DELAY ?? 0;
  const greys = data.assessments.zoneDistribution.GREY_ZONE ?? 0;
  const onTrack = data.assessments.zoneDistribution.NORMAL ?? 0;

  const delayPct = totalZoneAssessments > 0 ? (delays / totalZoneAssessments) * 100 : 0;
  const greyPct = totalZoneAssessments > 0 ? (greys / totalZoneAssessments) * 100 : 0;

  const maxDomainDelays = Math.max(...data.domainDelays.map((d) => d.delays), 1);
  const maxAgeBucket = Math.max(...data.ageBuckets.map((b) => b.count), 1);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive dashboard"
        description="Privacy-safe intelligence across the entire developmental platform."
      />

      <KpiStrip>
        <KpiTile
          label="Children registered"
          value={data.children.total.toLocaleString()}
          hint={`${data.users.total} users total`}
          icon="🧒"
        />
        <KpiTile
          label="Assessments completed"
          value={(data.assessments.byStatus.COMPLETED ?? 0).toLocaleString()}
          hint={`${trend30Total} in last 30 days`}
          icon="📊"
        />
        <KpiTile
          label="Children with delays"
          value={`${delayPct.toFixed(1)}%`}
          hint={`${delays} of ${totalZoneAssessments} completed`}
          tone={delayPct > 20 ? 'danger' : delayPct > 10 ? 'warning' : 'neutral'}
          icon="🚨"
        />
        <KpiTile
          label="30-day completion rate"
          value={`${(data.completionRate30d * 100).toFixed(0)}%`}
          hint={`${data.activeParents30d} active parents`}
          tone="positive"
          icon="✅"
        />
      </KpiStrip>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/uploads" className="block transition hover:-translate-y-0.5">
          <QueueTile
            label="Pending AI reviews"
            count={data.queues.pendingReviews}
            hint="Questionnaire uploads awaiting human approval"
            tone="gold"
          />
        </Link>
        <Link href="/referrals" className="block transition hover:-translate-y-0.5">
          <QueueTile
            label="Open referrals"
            count={data.queues.openReferrals}
            hint="Children referred to specialists"
            tone="primary"
          />
        </Link>
        <Link href="/children/high-risk" className="block transition hover:-translate-y-0.5">
          <QueueTile
            label="High-risk children"
            count={data.queues.highRiskChildren}
            hint="2+ DELAY domains in latest check-in"
            tone="clay"
          />
        </Link>
        <Link href="/campaigns" className="block transition hover:-translate-y-0.5">
          <QueueTile
            label="Draft campaigns"
            count={data.queues.draftCampaigns}
            hint="Not yet scheduled"
            tone="dusk"
          />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Completions — last 30 days" description={`${trend30Total} total`}>
          <Sparkline points={trendPoints} width={420} height={88} tone="primary" className="w-full" />
          <div className="mt-2 flex justify-between text-xs text-ink-soft">
            <span>{data.assessmentsTrend[0]?.date}</span>
            <span>{data.assessmentsTrend[data.assessmentsTrend.length - 1]?.date}</span>
          </div>
        </SectionCard>

        <SectionCard title="Developmental zones" description="Latest distribution">
          <div className="flex items-center gap-4">
            <Donut
              slices={[
                { label: 'On track', value: onTrack, tone: 'teal' },
                { label: 'Keep watching', value: greys, tone: 'gold' },
                { label: 'Needs support', value: delays, tone: 'clay' },
              ]}
              center={
                <div>
                  <p className="text-xs text-ink-soft">Completed</p>
                  <p className="text-lg font-semibold text-ink">{totalZoneAssessments}</p>
                </div>
              }
            />
            <ul className="space-y-1.5 text-xs">
              <ZoneLegend label="On track" value={onTrack} color="teal" />
              <ZoneLegend label="Keep watching" value={greys} color="gold" />
              <ZoneLegend label="Needs support" value={delays} color="clay" />
            </ul>
          </div>
          {delayPct > 25 && (
            <p className="mt-3 text-xs text-clay-600">
              ⚠ Delay rate exceeds 25%. Review domain-level distribution.
            </p>
          )}
          {greyPct > 30 && (
            <p className="mt-1 text-xs text-gold-600">
              ⚠ Many children in monitoring zone. Consider intervention campaigns.
            </p>
          )}
        </SectionCard>

        <SectionCard title="Users by role" description={`${data.users.total} total`}>
          <ul className="space-y-1.5">
            {Object.entries(data.users.byRole)
              .sort((a, b) => b[1] - a[1])
              .map(([role, count]) => (
                <li
                  key={role}
                  className="flex items-center justify-between rounded-lg bg-sand-100/70 px-3 py-1.5 text-sm"
                >
                  <span className="text-ink-muted">{humanize(role)}</span>
                  <span className="font-semibold text-ink tabular-nums">{count}</span>
                </li>
              ))}
          </ul>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Domain delay distribution" description="Last 90 days · all completed assessments">
          {data.domainDelays.length === 0 ? (
            <p className="text-sm text-ink-soft">No completed assessments yet.</p>
          ) : (
            <ul className="space-y-3">
              {data.domainDelays.slice(0, 8).map((domain) => (
                <li key={domain.domainCode}>
                  <BarRow
                    label={`${domain.domainName} (${domain.domainCode})`}
                    value={domain.delays}
                    max={maxDomainDelays}
                    tone={domain.delays >= maxDomainDelays * 0.5 ? 'clay' : 'gold'}
                    hint={domain.greys > 0 ? `+ ${domain.greys} grey` : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Children by age" description="Active profiles">
          <ul className="space-y-3">
            {data.ageBuckets.map((bucket) => (
              <li key={bucket.label}>
                <BarRow label={bucket.label} value={bucket.count} max={maxAgeBucket} tone="primary" />
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Referral funnel" description="Stage distribution">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(['OPEN', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const).map((stage) => (
            <div key={stage} className="rounded-xl bg-sand-100/70 px-3 py-2.5">
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-soft">
                {humanize(stage)}
              </p>
              <p className="mt-1 text-xl font-semibold text-ink tabular-nums">
                {data.referralFunnel[stage] ?? 0}
              </p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function ZoneLegend({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'teal' | 'gold' | 'clay';
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: `var(--color-${color}-500)` }}
      />
      <span className="text-ink-muted">{label}</span>
      <span className="ml-auto font-semibold text-ink tabular-nums">{value}</span>
    </li>
  );
}
