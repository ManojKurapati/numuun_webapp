'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, type UploadRow } from '@namo/api-client';
import {
  Alert,
  Badge,
  Button,
  DataTable,
  Field,
  FilterBar,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

const STATUSES = [
  '',
  'UPLOADED',
  'PROCESSING',
  'EXTRACTED',
  'NEEDS_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
] as const;

export default function UploadsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [fileName, setFileName] = useState('asq-12-months.pdf');
  const [createError, setCreateError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-uploads', status],
    queryFn: () => api().adminUploads({ status: status || undefined, pageSize: 200 }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api().adminCreateUpload({
        fileName,
        mimeType: 'application/pdf',
        sizeBytes: 512_000,
        storageKey: `local/${Date.now()}-${fileName}`,
      }),
    onSuccess: async () => {
      setShowNew(false);
      setCreateError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-uploads'] });
    },
    onError: (error) =>
      setCreateError(error instanceof ApiError ? error.message : 'Could not create the upload.'),
  });

  const extractMutation = useMutation({
    mutationFn: (id: string) => api().adminRunExtraction(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-uploads'] });
    },
  });

  const columns: DataColumn<UploadRow>[] = [
    {
      key: 'file',
      header: 'File',
      render: (row) => (
        <div>
          <a
            href={`/uploads/${row.id}`}
            className="font-medium text-ink hover:text-primary-600"
          >
            {row.fileName}
          </a>
          <p className="text-xs text-ink-soft">
            {(row.sizeBytes / 1024).toFixed(0)} KB · {row.mimeType}
          </p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge value={row.status} /> },
    {
      key: 'confidence',
      header: 'Confidence',
      align: 'right',
      render: (row) =>
        row.confidence != null ? (
          <Badge tone={row.confidence > 0.85 ? 'teal' : row.confidence > 0.7 ? 'gold' : 'clay'}>
            {(row.confidence * 100).toFixed(0)}%
          </Badge>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: 'warnings',
      header: 'Warnings',
      align: 'right',
      render: (row) =>
        row.warningCount > 0 ? (
          <Badge tone="gold">{row.warningCount}</Badge>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: 'createdBy',
      header: 'Uploaded by',
      render: (row) => (
        <div>
          <p className="text-ink">{row.createdBy.fullName}</p>
          <p className="text-xs text-ink-soft">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          {row.status === 'UPLOADED' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => extractMutation.mutate(row.id)}
              loading={extractMutation.isPending && extractMutation.variables === row.id}
            >
              Run AI
            </Button>
          )}
          <a
            href={`/uploads/${row.id}`}
            className="rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
          >
            Review
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI extraction review"
        description="Upload ASQ questionnaires, run the AI extractor, and approve before publishing."
        actions={
          <Button onClick={() => setShowNew((open) => !open)} variant={showNew ? 'ghost' : 'primary'}>
            {showNew ? 'Cancel' : 'New upload'}
          </Button>
        }
      />

      {showNew && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            createMutation.mutate();
          }}
          className="grid gap-3 rounded-2xl border border-sand-200 bg-surface p-4 sm:grid-cols-[2fr_1fr] sm:items-end"
        >
          {createError && (
            <div className="sm:col-span-2">
              <Alert variant="error">{createError}</Alert>
            </div>
          )}
          <Field label="File name" hint="A placeholder upload — wires the same workflow as a real PDF.">
            <Input value={fileName} onChange={(event) => setFileName(event.target.value)} />
          </Field>
          <Button type="submit" loading={createMutation.isPending}>
            Register upload
          </Button>
          <p className="text-xs text-ink-soft sm:col-span-2">
            In production this would accept a real PDF and stream it to object storage; here we register a
            row so the AI/human review workflow can be operated end-to-end.
          </p>
        </form>
      )}

      <FilterBar>
        <Select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Any status</option>
          {STATUSES.filter(Boolean).map((value) => (
            <option key={value} value={value}>
              {value.replace(/_/g, ' ')}
            </option>
          ))}
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {listQuery.data ? `${listQuery.data.total} uploads` : ' '}
        </div>
      </FilterBar>

      {listQuery.isError && <Alert variant="error">We couldn&apos;t load uploads.</Alert>}

      <DataTable<UploadRow>
        columns={columns}
        rows={listQuery.data?.items ?? []}
        rowKey={(row) => row.id}
        loading={listQuery.isLoading}
        empty="No uploads yet. Click ‘New upload’ to start."
      />
    </div>
  );
}
