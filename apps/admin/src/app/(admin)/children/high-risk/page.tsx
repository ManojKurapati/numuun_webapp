'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import type { RiskLevel } from '@namo/api-client';
import {
  Alert,
  Badge,
  DataTable,
  FilterBar,
  PageHeader,
  RiskBadge,
  Select,
  ZoneBadge,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

interface Row {
  id: string;
  firstName: string;
  lastName: string | null;
  ageMonths: number;
  parent: { fullName: string; phone: string | null };
  delayDomainCount: number;
  riskLevel: RiskLevel;
  riskScore: number;
  latestZone: 'NORMAL' | 'GREY_ZONE' | 'DELAY' | null;
  lastAssessmentAt: string | null;
}

export default function HighRiskQueuePage() {
  const [min, setMin] = useState<RiskLevel>('HIGH');
  const queueQuery = useQuery({
    queryKey: ['admin-high-risk', min],
    queryFn: () => api().adminHighRisk({ minRiskLevel: min }),
  });

  const columns: DataColumn<Row>[] = [
    {
      key: 'child',
      header: 'Child',
      render: (row) => (
        <Link href={`/children/${row.id}`} className="font-medium text-ink hover:text-primary-600">
          {row.firstName} {row.lastName ?? ''}
          <div className="text-xs text-ink-soft">{row.ageMonths} mo</div>
        </Link>
      ),
    },
    {
      key: 'parent',
      header: 'Parent',
      render: (row) => (
        <div>
          <p className="text-ink">{row.parent.fullName}</p>
          <p className="text-xs text-ink-soft">{row.parent.phone ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (row) => (
        <div className="flex items-center gap-2">
          <RiskBadge level={row.riskLevel} />
          <Badge tone="neutral">score {row.riskScore}</Badge>
        </div>
      ),
    },
    {
      key: 'delays',
      header: 'Delay domains',
      align: 'right',
      render: (row) => <span className="text-ink">{row.delayDomainCount}</span>,
    },
    {
      key: 'zone',
      header: 'Latest zone',
      render: (row) =>
        row.latestZone ? <ZoneBadge zone={row.latestZone} /> : <Badge tone="neutral">—</Badge>,
    },
    {
      key: 'last',
      header: 'Last activity',
      render: (row) => (
        <span className="text-xs text-ink-muted">
          {row.lastAssessmentAt ? formatDate(row.lastAssessmentAt) : '—'}
        </span>
      ),
    },
    {
      key: 'cta',
      header: '',
      render: (row) => (
        <Link
          href={`/children/${row.id}`}
          className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
        >
          Open case
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="High-risk queue"
        description="Children automatically prioritised by delay severity, count, and regression signals."
      />

      <FilterBar>
        <span className="text-xs font-medium text-ink-soft">Minimum risk</span>
        <Select value={min} onChange={(event) => setMin(event.target.value as RiskLevel)}>
          <option value="CRITICAL">Critical only</option>
          <option value="HIGH">High and above</option>
          <option value="MEDIUM">Medium and above</option>
          <option value="LOW">Low and above</option>
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {queueQuery.data ? `${queueQuery.data.items.length} children` : ' '}
        </div>
      </FilterBar>

      {queueQuery.isError && (
        <Alert variant="error">We couldn&apos;t load the high-risk queue.</Alert>
      )}

      <DataTable<Row>
        columns={columns}
        rows={(queueQuery.data?.items ?? []) as Row[]}
        rowKey={(row) => row.id}
        loading={queueQuery.isLoading}
        empty="No children currently meet this risk threshold."
      />
    </div>
  );
}
