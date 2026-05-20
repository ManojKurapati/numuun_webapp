'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Alert,
  BarRow,
  KpiStrip,
  KpiTile,
  PageHeader,
  SectionCard,
  Skeleton,
  StatusBadge,
} from '@namo/ui';
import { api } from '@/lib/api';

export default function SystemOpsPage() {
  const healthQuery = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: () => api().adminSystemHealth(),
    refetchInterval: 15_000,
  });

  if (healthQuery.isLoading) {
    return (
      <div className="space-y-4">
        <PageHeader title="System operations" />
        <Skeleton className="h-32" />
        <Skeleton className="h-48" />
      </div>
    );
  }
  if (healthQuery.isError || !healthQuery.data) {
    return (
      <div className="space-y-4">
        <PageHeader title="System operations" />
        <Alert variant="error">We couldn&apos;t reach the health check endpoints.</Alert>
      </div>
    );
  }

  const health = healthQuery.data;
  const degraded = health.services.filter((service) => service.status !== 'UP').length;
  const totalQueueDepth = health.queues.reduce((sum, queue) => sum + queue.depth, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="System operations"
        description="Live service health, queue depths and AI quality metrics. Refreshes every 15 seconds."
      />

      <KpiStrip>
        <KpiTile
          label="Services up"
          value={`${health.services.length - degraded} / ${health.services.length}`}
          tone={degraded === 0 ? 'positive' : 'warning'}
        />
        <KpiTile label="Queue backlog" value={totalQueueDepth} hint="Items pending across queues" />
        <KpiTile
          label="AI services"
          value={health.aiMetrics.length}
          hint="Tracked AI quality metrics"
        />
        <KpiTile
          label="Avg API latency"
          value={`${health.services.find((service) => service.name === 'API')?.latencyMs ?? 0} ms`}
          tone="positive"
        />
      </KpiStrip>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Service health">
          <ul className="space-y-2">
            {health.services.map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl bg-sand-100/50 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">{service.name}</p>
                  {service.latencyMs != null && (
                    <p className="text-xs text-ink-soft">{service.latencyMs} ms p50</p>
                  )}
                </div>
                <StatusBadge value={service.status} />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Queues">
          {health.queues.length === 0 ? (
            <p className="text-sm text-ink-soft">No queues being tracked.</p>
          ) : (
            <ul className="space-y-3">
              {health.queues.map((queue) => (
                <li key={queue.name}>
                  <BarRow
                    label={queue.name}
                    value={queue.depth}
                    max={Math.max(...health.queues.map((q) => q.depth), 10)}
                    tone={queue.depth > 20 ? 'clay' : queue.depth > 5 ? 'gold' : 'teal'}
                  />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="AI quality metrics" description="OCR, ASR, NLP and recommendation acceptance">
          <ul className="space-y-3">
            {health.aiMetrics.map((metric) => (
              <li key={metric.name}>
                <BarRow
                  label={metric.name}
                  value={Math.round(metric.value * 100)}
                  max={100}
                  tone={metric.value >= 0.85 ? 'teal' : metric.value >= 0.7 ? 'gold' : 'clay'}
                  hint={metric.unit}
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard
          title="Operating notes"
          description="Real production deployments wire these to OpenTelemetry, Prometheus and Grafana."
        >
          <ul className="space-y-2 text-sm text-ink-muted">
            <li>• API p95 target: under 300 ms.</li>
            <li>• PostgreSQL connection pool: investigate at &gt; 80% saturation.</li>
            <li>• AI extraction queue: alert above 25 pending uploads.</li>
            <li>• Voice ASR accuracy floor: 0.85 — currently in DEGRADED window above.</li>
            <li>• Notification delivery: retry with backoff at the channel layer.</li>
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
