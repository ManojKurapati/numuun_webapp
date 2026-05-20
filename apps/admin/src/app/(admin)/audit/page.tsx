'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { AuditEntryRow } from '@namo/api-client';
import {
  Alert,
  Badge,
  DataTable,
  FilterBar,
  Input,
  PageHeader,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

export default function AuditLogPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const auditQuery = useQuery({
    queryKey: ['admin-audit', action, entityType],
    queryFn: () =>
      api().adminAudit({
        action: action || undefined,
        entityType: entityType || undefined,
        pageSize: 200,
      }),
  });

  const columns: DataColumn<AuditEntryRow>[] = [
    {
      key: 'when',
      header: 'When',
      render: (row) => (
        <span className="text-xs text-ink-muted">{new Date(row.createdAt).toLocaleString()}</span>
      ),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (row) =>
        row.actor ? (
          <div>
            <p className="text-ink">{row.actor.fullName}</p>
            <p className="text-xs text-ink-soft">{row.actor.email}</p>
          </div>
        ) : (
          <span className="text-ink-soft">System</span>
        ),
    },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <Badge tone="primary">{humanize(row.action)}</Badge>,
    },
    {
      key: 'entity',
      header: 'Entity',
      render: (row) => (
        <div>
          <p className="text-ink">{row.entityType}</p>
          {row.entityId && <p className="font-mono text-[0.65rem] text-ink-soft">{row.entityId.slice(0, 8)}…</p>}
        </div>
      ),
    },
    {
      key: 'meta',
      header: 'Metadata',
      render: (row) =>
        row.metadata ? (
          <code className="block max-w-md truncate rounded bg-sand-100 px-2 py-0.5 text-[0.65rem] text-ink-muted">
            {JSON.stringify(row.metadata)}
          </code>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => <span className="text-xs text-ink-soft">{row.ipAddress ?? '—'}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Audit log"
        description="Every administrator action — for compliance, security review and forensics."
      />

      <FilterBar>
        <Input
          placeholder="Filter by action (e.g. REFERRAL_CREATED)"
          value={action}
          onChange={(event) => setAction(event.target.value)}
          className="w-72"
        />
        <Input
          placeholder="Entity type (e.g. Referral)"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
          className="w-56"
        />
        <div className="ml-auto text-xs text-ink-soft">
          {auditQuery.data ? `${auditQuery.data.total} events` : ' '}
        </div>
      </FilterBar>

      {auditQuery.isError && <Alert variant="error">We couldn&apos;t load audit events.</Alert>}

      <DataTable<AuditEntryRow>
        columns={columns}
        rows={auditQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={auditQuery.isLoading}
        dense
        empty="No audit events match these filters."
      />
    </div>
  );
}
