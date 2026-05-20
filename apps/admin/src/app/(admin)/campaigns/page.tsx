'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, type CampaignRow } from '@namo/api-client';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  DataTable,
  Field,
  FilterBar,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  type DataColumn,
} from '@namo/ui';
import { USER_ROLES } from '@namo/types';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

const CHANNELS = ['PUSH', 'SMS', 'EMAIL'] as const;
const STATUSES = ['', 'DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'] as const;

export default function CampaignsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>('PUSH');
  const [audience, setAudience] = useState<string[]>(['PARENT']);
  const [scheduledFor, setScheduledFor] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-campaigns', status],
    queryFn: () => api().adminCampaigns({ status: status || undefined, pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api().adminCreateCampaign({
        title,
        body,
        channel,
        audienceRoles: audience,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      }),
    onSuccess: async () => {
      setShowForm(false);
      setTitle('');
      setBody('');
      setAudience(['PARENT']);
      setScheduledFor('');
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : 'Could not create campaign.'),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => api().adminSendCampaign(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    },
  });

  const columns: DataColumn<CampaignRow>[] = [
    {
      key: 'title',
      header: 'Campaign',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.title}</p>
          <p className="line-clamp-2 text-xs text-ink-soft">{row.body}</p>
        </div>
      ),
    },
    {
      key: 'channel',
      header: 'Channel',
      render: (row) => <Badge tone="neutral">{row.channel}</Badge>,
    },
    {
      key: 'audience',
      header: 'Audience',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.audienceRoles.map((role) => (
            <Badge key={role} tone="neutral">
              {humanize(role)}
            </Badge>
          ))}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'recipients',
      header: 'Recipients',
      align: 'right',
      render: (row) => <span className="text-ink">{row.recipientCount}</span>,
    },
    {
      key: 'sent',
      header: 'Sent / scheduled',
      render: (row) => (
        <span className="text-xs text-ink-muted">
          {row.sentAt ? formatDate(row.sentAt) : row.scheduledFor ? `→ ${formatDate(row.scheduledFor)}` : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'DRAFT' || row.status === 'SCHEDULED' ? (
          <Button
            size="sm"
            onClick={() => sendMutation.mutate(row.id)}
            loading={sendMutation.isPending && sendMutation.variables === row.id}
          >
            Send now
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Communication"
        description="Push notifications, SMS and email campaigns to parents, clinicians and partners."
        actions={
          <Button onClick={() => setShowForm((open) => !open)} variant={showForm ? 'ghost' : 'primary'}>
            {showForm ? 'Cancel' : 'New campaign'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardBody>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (title.length < 3 || body.length < 3) {
                  setFormError('Title and body are required.');
                  return;
                }
                if (audience.length === 0) {
                  setFormError('Choose at least one audience role.');
                  return;
                }
                createMutation.mutate();
              }}
              className="grid gap-3 sm:grid-cols-2"
            >
              {formError && (
                <div className="sm:col-span-2">
                  <Alert variant="error">{formError}</Alert>
                </div>
              )}
              <Field label="Title" required>
                <Input value={title} onChange={(event) => setTitle(event.target.value)} />
              </Field>
              <Field label="Channel" required>
                <Select
                  value={channel}
                  onChange={(event) => setChannel(event.target.value as typeof channel)}
                >
                  {CHANNELS.map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Message body" required>
                  <Textarea
                    rows={3}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write the message you want to send."
                  />
                </Field>
              </div>
              <Field label="Audience" hint="Hold Cmd/Ctrl to select multiple.">
                <select
                  multiple
                  className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
                  value={audience}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions, (option) => option.value);
                    setAudience(selected);
                  }}
                  size={4}
                >
                  {USER_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {humanize(role)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Schedule for (optional)">
                <input
                  type="datetime-local"
                  className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
                  value={scheduledFor}
                  onChange={(event) => setScheduledFor(event.target.value)}
                />
              </Field>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" loading={createMutation.isPending}>
                  Save campaign
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <FilterBar>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          {STATUSES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {humanize(value)}
            </option>
          ))}
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {listQuery.data ? `${listQuery.data.total} campaigns` : ' '}
        </div>
      </FilterBar>

      {listQuery.isError && <Alert variant="error">We couldn&apos;t load campaigns.</Alert>}

      <DataTable<CampaignRow>
        columns={columns}
        rows={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={listQuery.isLoading}
        empty="No campaigns yet. Click ‘New campaign’ to draft one."
      />
    </div>
  );
}
