'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ApiError, type InterventionRow } from '@namo/api-client';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  DataTable,
  DetailDrawer,
  EmptyState,
  Field,
  FilterBar,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  Textarea,
  type DataColumn,
} from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

const DIFFICULTIES = ['EASY', 'MODERATE', 'CHALLENGING'] as const;
const DOMAIN_OPTIONS = ['COM', 'GM', 'FM', 'PS', 'PSL'];

interface FormState {
  title: string;
  description: string;
  domainCodes: string[];
  ageMinMonths: string;
  ageMaxMonths: string;
  difficulty: (typeof DIFFICULTIES)[number];
  durationMinutes: string;
  materials: string;
  videoUrl: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  description: '',
  domainCodes: ['COM'],
  ageMinMonths: '0',
  ageMaxMonths: '12',
  difficulty: 'EASY',
  durationMinutes: '10',
  materials: '',
  videoUrl: '',
};

export default function InterventionsPage() {
  const queryClient = useQueryClient();
  const [domain, setDomain] = useState('');
  const [published, setPublished] = useState<'' | 'true' | 'false'>('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [selected, setSelected] = useState<InterventionRow | null>(null);

  const listQuery = useQuery({
    queryKey: ['admin-interventions', domain, published],
    queryFn: () =>
      api().adminInterventions({
        domain: domain || undefined,
        published: published || undefined,
        pageSize: 200,
      }),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api().adminCreateIntervention({
        title: form.title,
        description: form.description,
        domainCodes: form.domainCodes,
        ageMinMonths: Number(form.ageMinMonths),
        ageMaxMonths: Number(form.ageMaxMonths),
        difficulty: form.difficulty,
        durationMinutes: Number(form.durationMinutes),
        materials: form.materials || undefined,
        videoUrl: form.videoUrl || undefined,
      }),
    onSuccess: async () => {
      setShowForm(false);
      setForm(EMPTY_FORM);
      setFormError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-interventions'] });
    },
    onError: (error) =>
      setFormError(error instanceof ApiError ? error.message : 'Could not create intervention.'),
  });

  const togglePublish = useMutation({
    mutationFn: (intervention: InterventionRow) =>
      api().adminUpdateIntervention(intervention.id, { isPublished: !intervention.isPublished }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-interventions'] });
    },
  });

  const columns: DataColumn<InterventionRow>[] = [
    {
      key: 'title',
      header: 'Activity',
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelected(row)}
          className="text-left font-medium text-ink hover:text-primary-600"
        >
          {row.title}
          <p className="text-xs font-normal text-ink-soft">{row.description}</p>
        </button>
      ),
    },
    {
      key: 'domains',
      header: 'Domains',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.domainCodes.map((code) => (
            <Badge key={code} tone="neutral">
              {code}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: 'age',
      header: 'Age',
      render: (row) => (
        <span className="text-ink-muted">{row.ageMinMonths}–{row.ageMaxMonths} mo</span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (row) => <Badge tone="neutral">{humanize(row.difficulty)}</Badge>,
    },
    {
      key: 'effectiveness',
      header: 'Effectiveness',
      align: 'right',
      render: (row) =>
        row.effectiveness != null ? (
          <Badge tone={row.effectiveness > 0.7 ? 'teal' : 'gold'}>
            {(row.effectiveness * 100).toFixed(0)}%
          </Badge>
        ) : (
          <span className="text-ink-soft">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge value={row.isPublished ? 'PUBLISHED' : 'DRAFT'} />
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => togglePublish.mutate(row)}
          loading={togglePublish.isPending && togglePublish.variables?.id === row.id}
        >
          {row.isPublished ? 'Unpublish' : 'Publish'}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Intervention library"
        description="Activities, videos and play-based interventions mapped to developmental domains."
        actions={
          <Button onClick={() => setShowForm((open) => !open)} variant={showForm ? 'ghost' : 'primary'}>
            {showForm ? 'Cancel' : 'New activity'}
          </Button>
        }
      />

      {showForm && (
        <Card>
          <CardBody>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (form.title.length < 3 || form.description.length < 10) {
                  setFormError('Title and description are required.');
                  return;
                }
                if (Number(form.ageMaxMonths) < Number(form.ageMinMonths)) {
                  setFormError('Max age must be >= min age.');
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
                <Input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                />
              </Field>
              <Field label="Difficulty" required>
                <Select
                  value={form.difficulty}
                  onChange={(event) =>
                    setForm({ ...form, difficulty: event.target.value as FormState['difficulty'] })
                  }
                >
                  {DIFFICULTIES.map((value) => (
                    <option key={value} value={value}>
                      {humanize(value)}
                    </option>
                  ))}
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" required>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </Field>
              </div>
              <Field label="Domains" hint="Comma-separated domain codes.">
                <Input
                  value={form.domainCodes.join(',')}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      domainCodes: event.target.value.split(',').map((c) => c.trim()).filter(Boolean),
                    })
                  }
                  placeholder="COM, FM"
                />
              </Field>
              <Field label="Duration (min)">
                <Input
                  type="number"
                  min={1}
                  value={form.durationMinutes}
                  onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })}
                />
              </Field>
              <Field label="Age min (months)">
                <Input
                  type="number"
                  min={0}
                  value={form.ageMinMonths}
                  onChange={(event) => setForm({ ...form, ageMinMonths: event.target.value })}
                />
              </Field>
              <Field label="Age max (months)">
                <Input
                  type="number"
                  min={0}
                  value={form.ageMaxMonths}
                  onChange={(event) => setForm({ ...form, ageMaxMonths: event.target.value })}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Materials" hint="Comma-separated list.">
                  <Input
                    value={form.materials}
                    onChange={(event) => setForm({ ...form, materials: event.target.value })}
                  />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Video URL">
                  <Input
                    value={form.videoUrl}
                    onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}
                    placeholder="https://"
                  />
                </Field>
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <Button type="submit" loading={createMutation.isPending}>
                  Create activity
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <FilterBar>
        <Select value={domain} onChange={(event) => setDomain(event.target.value)}>
          <option value="">Any domain</option>
          {DOMAIN_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </Select>
        <Select
          value={published}
          onChange={(event) => setPublished(event.target.value as typeof published)}
        >
          <option value="">Any status</option>
          <option value="true">Published</option>
          <option value="false">Draft</option>
        </Select>
        <div className="ml-auto text-xs text-ink-soft">
          {listQuery.data ? `${listQuery.data.total} interventions` : ' '}
        </div>
      </FilterBar>

      {listQuery.isError && <Alert variant="error">We couldn&apos;t load interventions.</Alert>}

      {listQuery.data && listQuery.data.items.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No interventions yet"
          description="Create your first activity to start mapping interventions to developmental delays."
        />
      ) : (
        <DataTable<InterventionRow>
          columns={columns}
          rows={listQuery.data?.items ?? []}
          rowKey={(row) => row.id}
          loading={listQuery.isLoading}
          empty="No interventions match."
        />
      )}

      <DetailDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ''}
        description={selected ? `${selected.ageMinMonths}–${selected.ageMaxMonths} months` : ''}
      >
        {selected && (
          <div className="space-y-3 text-sm">
            <p className="text-ink">{selected.description}</p>
            <div className="grid grid-cols-2 gap-2">
              <Detail label="Difficulty" value={humanize(selected.difficulty)} />
              <Detail label="Duration" value={`${selected.durationMinutes} min`} />
              <Detail label="Domains" value={selected.domainCodes.join(', ')} />
              <Detail label="Status" value={selected.isPublished ? 'Published' : 'Draft'} />
              <Detail label="Views" value={String(selected.views)} />
              <Detail label="Completions" value={String(selected.completions)} />
            </div>
            {selected.materials && (
              <Detail label="Materials" value={selected.materials} block />
            )}
            {selected.videoUrl && (
              <Detail
                label="Video"
                value={
                  <a
                    href={selected.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:underline"
                  >
                    Open
                  </a>
                }
                block
              />
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

function Detail({
  label,
  value,
  block,
}: {
  label: string;
  value: React.ReactNode;
  block?: boolean;
}) {
  return (
    <div className={block ? 'col-span-2' : ''}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-0.5 text-sm text-ink">{value}</p>
    </div>
  );
}
