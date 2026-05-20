'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { RiskLevel } from '@namo/api-client';
import {
  Alert,
  Badge,
  DataTable,
  FilterBar,
  Input,
  PageHeader,
  RiskBadge,
  Select,
  ZoneBadge,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';

const RISK_OPTIONS: { value: '' | RiskLevel; label: string }[] = [
  { value: '', label: 'Any risk level' },
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
  { value: 'NONE', label: 'No risk' },
];

const AGE_BANDS = [
  { value: '', label: 'Any age' },
  { value: '0,12', label: '0–12 months' },
  { value: '13,24', label: '13–24 months' },
  { value: '25,36', label: '25–36 months' },
  { value: '37,72', label: '37+ months' },
];

interface Row {
  id: string;
  firstName: string;
  lastName: string | null;
  ageMonths: number;
  parent: { fullName: string; phone: string | null; email: string };
  assessmentCount: number;
  latestZone: 'NORMAL' | 'GREY_ZONE' | 'DELAY' | null;
  delayDomainCount: number;
  riskLevel: RiskLevel;
  lastAssessmentAt: string | null;
}

export default function ChildrenSearchPage() {
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [risk, setRisk] = useState<'' | RiskLevel>('');
  const [age, setAge] = useState<string>('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const [ageMin, ageMax] = useMemo(() => {
    if (!age) return [undefined, undefined] as const;
    const [min, max] = age.split(',').map((n) => Number.parseInt(n, 10));
    return [min, max] as const;
  }, [age]);

  const searchQuery = useQuery({
    queryKey: ['admin-children-search', debouncedQ, risk, ageMin, ageMax],
    queryFn: () =>
      api().adminSearchChildren({
        q: debouncedQ || undefined,
        riskLevel: (risk || undefined) as RiskLevel | undefined,
        ageMinMonths: ageMin,
        ageMaxMonths: ageMax,
        pageSize: 100,
      }),
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
          <p className="text-xs text-ink-soft">{row.parent.phone ?? row.parent.email}</p>
        </div>
      ),
    },
    {
      key: 'assessments',
      header: 'Assessments',
      align: 'right',
      render: (row) => <span className="text-ink">{row.assessmentCount}</span>,
    },
    {
      key: 'zone',
      header: 'Latest zone',
      render: (row) =>
        row.latestZone ? <ZoneBadge zone={row.latestZone} /> : <Badge tone="neutral">—</Badge>,
    },
    {
      key: 'risk',
      header: 'Risk',
      render: (row) => (
        <div className="flex items-center gap-2">
          <RiskBadge level={row.riskLevel} />
          {row.delayDomainCount > 0 && (
            <span className="text-xs text-ink-soft">
              {row.delayDomainCount} delay domain{row.delayDomainCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'last',
      header: 'Last activity',
      render: (row) =>
        row.lastAssessmentAt ? (
          <span className="text-xs text-ink-muted">
            {new Date(row.lastAssessmentAt).toLocaleDateString()}
          </span>
        ) : (
          <span className="text-xs text-ink-soft">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Children"
        description="Search every child across the platform — by name, parent, region or risk."
      />

      <FilterBar>
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by child name, parent name, email or phone"
          className="w-72"
        />
        <Select value={risk} onChange={(event) => setRisk(event.target.value as RiskLevel | '')}>
          {RISK_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Select value={age} onChange={(event) => setAge(event.target.value)}>
          {AGE_BANDS.map((band) => (
            <option key={band.value} value={band.value}>
              {band.label}
            </option>
          ))}
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {searchQuery.data ? `${searchQuery.data.total} result${searchQuery.data.total === 1 ? '' : 's'}` : ' '}
        </div>
      </FilterBar>

      {searchQuery.isError && (
        <Alert variant="error">We couldn&apos;t load the child list.</Alert>
      )}

      <DataTable<Row>
        columns={columns}
        rows={(searchQuery.data?.items ?? []) as Row[]}
        rowKey={(row) => row.id}
        loading={searchQuery.isLoading}
        empty={
          debouncedQ || risk || age
            ? 'No children match these filters.'
            : 'Children appear here as parents sign up.'
        }
      />

      {searchQuery.data && searchQuery.data.items.length > 0 && (
        <p className="text-xs text-ink-soft">
          Showing {searchQuery.data.items.length} of {searchQuery.data.total}. Refine your filters
          to narrow further; full pagination is available via the API.
        </p>
      )}

    </div>
  );
}
