'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import type { AssessmentSummary } from '@namo/api-client';
import type { Zone } from '@namo/types';
import {
  Alert,
  Badge,
  DataTable,
  FilterBar,
  KpiStrip,
  KpiTile,
  PageHeader,
  Select,
  ZoneBadge,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

type ZoneFilter = '' | Zone;

export default function AssessmentsLibraryPage() {
  const [zone, setZone] = useState<ZoneFilter>('');
  const [status, setStatus] = useState('');

  const assessmentsQuery = useQuery({
    queryKey: ['admin-assessments'],
    queryFn: () => api().adminAssessments({ pageSize: 200 }),
  });

  const rows = useMemo(() => {
    const items = assessmentsQuery.data?.items ?? [];
    return items.filter((row) => {
      if (zone && row.overallZone !== zone) return false;
      if (status && row.status !== status) return false;
      return true;
    });
  }, [assessmentsQuery.data, zone, status]);

  const completed = rows.filter((row) => row.status === 'COMPLETED');
  const delays = completed.filter((row) => row.overallZone === 'DELAY').length;
  const greys = completed.filter((row) => row.overallZone === 'GREY_ZONE').length;
  const inProgress = rows.filter((row) => row.status === 'IN_PROGRESS').length;

  const columns: DataColumn<AssessmentSummary>[] = [
    {
      key: 'id',
      header: 'Assessment',
      render: (row) => (
        <div>
          <p className="font-mono text-xs text-ink-soft">{row.id.slice(0, 8)}…</p>
          <p className="text-xs text-ink-muted">Age {row.childAgeMonths} mo</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge tone={row.status === 'COMPLETED' ? 'teal' : 'primary'}>
          {row.status === 'COMPLETED' ? 'Completed' : 'In progress'}
        </Badge>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      align: 'right',
      render: (row) =>
        row.totalScore != null && row.totalMaxScore != null ? (
          <span className="text-ink">
            {row.totalScore} / {row.totalMaxScore}
          </span>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: 'zone',
      header: 'Outcome',
      render: (row) => (row.overallZone ? <ZoneBadge zone={row.overallZone} /> : <Badge tone="neutral">—</Badge>),
    },
    {
      key: 'started',
      header: 'Started',
      render: (row) => <span className="text-xs text-ink-muted">{formatDate(row.createdAt)}</span>,
    },
    {
      key: 'completed',
      header: 'Completed',
      render: (row) => (
        <span className="text-xs text-ink-muted">
          {row.completedAt ? formatDate(row.completedAt) : '—'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assessments"
        description="Every developmental check-in across the platform — completed, in progress, and at risk."
      />

      <KpiStrip>
        <KpiTile label="Total" value={rows.length} />
        <KpiTile label="Completed" value={completed.length} tone="positive" />
        <KpiTile label="In progress" value={inProgress} />
        <KpiTile
          label="Delays"
          value={delays}
          hint={`${greys} in grey zone`}
          tone={delays > 0 ? 'warning' : 'neutral'}
        />
      </KpiStrip>

      <FilterBar>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          <option value="COMPLETED">Completed</option>
          <option value="IN_PROGRESS">In progress</option>
        </Select>
        <Select value={zone} onChange={(event) => setZone(event.target.value as ZoneFilter)}>
          <option value="">Any outcome</option>
          <option value="NORMAL">On track</option>
          <option value="GREY_ZONE">Keep watching</option>
          <option value="DELAY">Needs support</option>
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {assessmentsQuery.data ? `${rows.length} of ${assessmentsQuery.data.total}` : ' '}
        </div>
      </FilterBar>

      {assessmentsQuery.isError && (
        <Alert variant="error">We couldn&apos;t load assessments.</Alert>
      )}

      <DataTable<AssessmentSummary>
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={assessmentsQuery.isLoading}
        empty="No assessments match these filters."
      />
    </div>
  );
}
