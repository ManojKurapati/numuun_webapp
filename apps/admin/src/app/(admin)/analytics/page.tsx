'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  BarRow,
  Donut,
  KpiStrip,
  KpiTile,
  PageHeader,
  SectionCard,
  Skeleton,
  Sparkline,
} from '@namo/ui';
import { api } from '@/lib/api';

export default function AnalyticsPage() {
  const snapshotQuery = useQuery({
    queryKey: ['admin-analytics-snapshot'],
    queryFn: () => api().adminExecutive(),
  });
  const childrenQuery = useQuery({
    queryKey: ['admin-analytics-children'],
    queryFn: () => api().adminSearchChildren({ pageSize: 100 }),
  });

  if (snapshotQuery.isLoading || childrenQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Population analytics" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Population analytics" />
        <Alert variant="error">We couldn&apos;t load analytics.</Alert>
      </div>
    );
  }

  const snapshot = snapshotQuery.data;
  const children = childrenQuery.data?.items ?? [];

  const riskTally = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, NONE: 0 };
  const genderTally: Record<string, number> = {};
  for (const child of children) {
    riskTally[child.riskLevel] = (riskTally[child.riskLevel] ?? 0) + 1;
    genderTally[child.gender] = (genderTally[child.gender] ?? 0) + 1;
  }

  const totalAssessments = Object.values(snapshot.assessments.zoneDistribution).reduce(
    (sum, n) => sum + n,
    0,
  );
  const delayPct = totalAssessments
    ? ((snapshot.assessments.zoneDistribution.DELAY ?? 0) / totalAssessments) * 100
    : 0;

  const maxDomain = Math.max(...snapshot.domainDelays.map((d) => d.delays + d.greys), 1);
  const trendPoints = snapshot.assessmentsTrend.map((row) => row.count);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Population analytics"
        description="Population-level developmental trends and cohort distributions."
      />

      <KpiStrip>
        <KpiTile
          label="Active children"
          value={snapshot.children.total.toLocaleString()}
          hint={`${children.length} loaded sample`}
        />
        <KpiTile
          label="Delay prevalence"
          value={`${delayPct.toFixed(1)}%`}
          tone={delayPct > 20 ? 'danger' : delayPct > 10 ? 'warning' : 'positive'}
        />
        <KpiTile
          label="Active parents (30d)"
          value={snapshot.activeParents30d.toLocaleString()}
        />
        <KpiTile
          label="Completion rate (30d)"
          value={`${(snapshot.completionRate30d * 100).toFixed(0)}%`}
        />
      </KpiStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Risk distribution" description="Across all children in the sample">
          <div className="flex items-center gap-4">
            <Donut
              slices={[
                { label: 'Critical', value: riskTally.CRITICAL, tone: 'clay' },
                { label: 'High', value: riskTally.HIGH, tone: 'gold' },
                { label: 'Medium', value: riskTally.MEDIUM, tone: 'primary' },
                { label: 'Low', value: riskTally.LOW, tone: 'teal' },
                { label: 'None', value: riskTally.NONE, tone: 'sand' },
              ]}
            />
            <ul className="space-y-1 text-sm">
              {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const).map((level) => (
                <li key={level} className="flex items-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        level === 'CRITICAL'
                          ? 'var(--color-clay-500)'
                          : level === 'HIGH'
                            ? 'var(--color-gold-500)'
                            : level === 'MEDIUM'
                              ? 'var(--color-primary-500)'
                              : level === 'LOW'
                                ? 'var(--color-teal-500)'
                                : 'var(--color-sand-400)',
                    }}
                  />
                  <span className="text-ink-muted">{level}</span>
                  <span className="ml-auto font-semibold text-ink tabular-nums">
                    {riskTally[level]}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        <SectionCard title="Domain heatmap" description="Delays and grey-zone in the last 90 days">
          {snapshot.domainDelays.length === 0 ? (
            <p className="text-sm text-ink-soft">No completed assessments yet.</p>
          ) : (
            <ul className="space-y-3">
              {snapshot.domainDelays.map((domain) => (
                <li key={domain.domainCode}>
                  <BarRow
                    label={`${domain.domainName} (${domain.domainCode})`}
                    value={domain.delays + domain.greys}
                    max={maxDomain}
                    tone={domain.delays >= 5 ? 'clay' : 'gold'}
                    hint={`${domain.delays} delays · ${domain.greys} grey`}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Completions over time" description="Daily totals for the last 30 days">
          <Sparkline points={trendPoints} width={420} height={120} tone="teal" className="w-full" />
          <p className="mt-2 text-xs text-ink-soft">
            {snapshot.assessmentsTrend[0]?.date} → {snapshot.assessmentsTrend[snapshot.assessmentsTrend.length - 1]?.date}
          </p>
        </SectionCard>

        <SectionCard title="Cohort by age band" description="Active profile counts">
          <ul className="space-y-3">
            {snapshot.ageBuckets.map((bucket) => (
              <li key={bucket.label}>
                <BarRow
                  label={bucket.label}
                  value={bucket.count}
                  max={Math.max(...snapshot.ageBuckets.map((b) => b.count), 1)}
                  tone="primary"
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Children by gender">
          <ul className="space-y-2">
            {Object.entries(genderTally).map(([gender, count]) => (
              <li
                key={gender}
                className="flex items-center justify-between rounded-xl bg-sand-100/60 px-3 py-2 text-sm"
              >
                <span className="text-ink-muted">{gender}</span>
                <span className="font-semibold text-ink tabular-nums">{count}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Referral funnel">
          <ul className="space-y-2">
            {Object.entries(snapshot.referralFunnel).map(([stage, count]) => (
              <li
                key={stage}
                className="flex items-center justify-between rounded-xl bg-sand-100/60 px-3 py-2 text-sm"
              >
                <span className="text-ink-muted">{stage}</span>
                <span className="font-semibold text-ink tabular-nums">{count}</span>
              </li>
            ))}
            {Object.keys(snapshot.referralFunnel).length === 0 && (
              <li className="text-sm text-ink-soft">No referrals yet.</li>
            )}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
