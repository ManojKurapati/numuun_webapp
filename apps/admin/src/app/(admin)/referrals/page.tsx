'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ApiError, type ReferralRow } from '@namo/api-client';
import type { UpdateReferralInput } from '@namo/validation';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  DetailDrawer,
  Field,
  FilterBar,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

const STATUSES = ['', 'OPEN', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'] as const;
const PRIORITIES = ['', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function ReferralsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [selected, setSelected] = useState<ReferralRow | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-referrals', status, priority],
    queryFn: () =>
      api().adminReferrals({
        status: status || undefined,
        priority: priority || undefined,
        pageSize: 200,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; patch: UpdateReferralInput }) =>
      api().adminUpdateReferral(payload.id, payload.patch),
    onSuccess: async (referral) => {
      setSelected(referral);
      await queryClient.invalidateQueries({ queryKey: ['admin-referrals'] });
    },
  });

  const columns: DataColumn<ReferralRow>[] = [
    {
      key: 'child',
      header: 'Child',
      render: (row) => (
        <Link href={`/children/${row.child.id}`} className="font-medium text-ink hover:text-primary-600">
          {row.child.name}
          <div className="text-xs text-ink-soft">{row.child.ageMonths} mo</div>
        </Link>
      ),
    },
    {
      key: 'kind',
      header: 'Specialist',
      render: (row) => <Badge tone="neutral">{humanize(row.kind)}</Badge>,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => <StatusBadge value={row.priority} />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge value={row.status} />,
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (row) => <span className="text-ink-muted">{row.reason}</span>,
    },
    {
      key: 'created',
      header: 'Opened',
      render: (row) => (
        <span className="text-xs text-ink-muted">{formatDate(row.createdAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Referrals"
        description="Track every child referred to specialists — pediatricians, therapists, psychologists."
      />

      <FilterBar>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          {STATUSES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </Select>
        <Select value={priority} onChange={(event) => setPriority(event.target.value)}>
          <option value="">Any priority</option>
          {PRIORITIES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {listQuery.data ? `${listQuery.data.total} referrals` : ' '}
        </div>
      </FilterBar>

      {listQuery.isError && <Alert variant="error">We couldn&apos;t load referrals.</Alert>}

      <DataTable<ReferralRow>
        columns={columns}
        rows={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={listQuery.isLoading}
        onRowClick={(row) => setSelected(row)}
        empty="No referrals on file. Create one from a child profile."
      />

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Referral · ${humanize(selected.kind)}` : ''}
        description={selected?.child.name}
      >
        {selected && (
          <ReferralEditor
            referral={selected}
            saving={updateMutation.isPending}
            error={
              updateMutation.error instanceof ApiError ? updateMutation.error.message : null
            }
            onSave={(patch) => updateMutation.mutate({ id: selected.id, patch })}
          />
        )}
      </DetailDrawer>
    </div>
  );
}

function ReferralEditor({
  referral,
  saving,
  error,
  onSave,
}: {
  referral: ReferralRow;
  saving: boolean;
  error: string | null;
  onSave: (patch: UpdateReferralInput) => void;
}) {
  const [status, setStatus] = useState(referral.status);
  const [priority, setPriority] = useState(referral.priority);
  const [notes, setNotes] = useState(referral.notes ?? '');
  const [outcome, setOutcome] = useState(referral.outcome ?? '');
  const [scheduled, setScheduled] = useState(
    referral.scheduledAt ? referral.scheduledAt.slice(0, 16) : '',
  );

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({
          status: status as UpdateReferralInput['status'],
          priority: priority as UpdateReferralInput['priority'],
          notes,
          outcome,
          scheduledAt: scheduled ? new Date(scheduled) : undefined,
        });
      }}
      className="space-y-4"
    >
      {error && <Alert variant="error">{error}</Alert>}
      <div className="rounded-xl bg-sand-100/50 px-3 py-2 text-xs text-ink-muted">
        Opened {formatDate(referral.createdAt)} by {referral.createdBy.fullName}. Reason:{' '}
        <span className="text-ink">{referral.reason}</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Status">
          <select
            className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUSES.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Priority">
          <select
            className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
          >
            {PRIORITIES.filter(Boolean).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Scheduled for">
        <input
          type="datetime-local"
          className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
          value={scheduled}
          onChange={(event) => setScheduled(event.target.value)}
        />
      </Field>
      <Field label="Notes">
        <Textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
      <Field label="Outcome">
        <Textarea
          rows={3}
          value={outcome}
          onChange={(event) => setOutcome(event.target.value)}
          placeholder="Record outcome once the referral is completed."
        />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
