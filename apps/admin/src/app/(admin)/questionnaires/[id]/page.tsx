'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@namo/api-client';
import type { BadgeTone } from '@namo/ui';
import { Alert, Badge, Button, Card, CardBody, CardHeader, CardTitle, Skeleton } from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'teal',
  ARCHIVED: 'clay',
};

export default function QuestionnaireDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['questionnaire', id],
    queryFn: () => api().getQuestionnaire(id),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['questionnaire', id] });
    await queryClient.invalidateQueries({ queryKey: ['questionnaires'] });
  };

  const publishMutation = useMutation({
    mutationFn: () => api().publishQuestionnaire(id),
    onSuccess: refresh,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not publish the questionnaire.'),
  });
  const archiveMutation = useMutation({
    mutationFn: () => api().archiveQuestionnaire(id),
    onSuccess: refresh,
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not archive the questionnaire.'),
  });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError || !data) {
    return <Alert variant="error">We couldn&apos;t load this questionnaire.</Alert>;
  }

  return (
    <div className="space-y-6">
      <Link href="/questionnaires" className="text-sm font-medium text-ink-muted hover:text-ink">
        ← All questionnaires
      </Link>

      {error && <Alert variant="error">{error}</Alert>}

      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-ink">{data.title}</h1>
              <Badge tone={STATUS_TONE[data.status] ?? 'neutral'}>{humanize(data.status)}</Badge>
            </div>
            {data.description && (
              <p className="mt-1 text-sm text-ink-muted">{data.description}</p>
            )}
            <p className="mt-2 text-xs text-ink-soft">
              Ages {data.ageMinMonths}–{data.ageMaxMonths} months · version {data.version} ·{' '}
              {data.domainCount} areas · {data.questionCount} questions
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            {data.status === 'DRAFT' && (
              <Button onClick={() => publishMutation.mutate()} loading={publishMutation.isPending}>
                Publish
              </Button>
            )}
            {data.status === 'PUBLISHED' && (
              <Button
                variant="secondary"
                onClick={() => archiveMutation.mutate()}
                loading={archiveMutation.isPending}
              >
                Archive
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {data.status === 'DRAFT' && (
        <Alert variant="warning" title="This questionnaire is a draft">
          Parents will only see it once it is published.
        </Alert>
      )}

      {data.domains.map((domain) => (
        <Card key={domain.id}>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>{domain.name}</CardTitle>
            <span className="text-xs text-ink-soft">
              Delay &lt; {domain.delayThreshold} · On track ≥ {domain.monitoringThreshold}
            </span>
          </CardHeader>
          <CardBody>
            <ol className="space-y-2.5">
              {domain.questions.map((question, index) => (
                <li key={question.id} className="flex gap-3 text-sm">
                  <span className="font-medium text-ink-soft">{index + 1}.</span>
                  <span className="text-ink">{question.text}</span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
