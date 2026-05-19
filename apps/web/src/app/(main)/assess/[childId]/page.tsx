'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@namo/api-client';
import { Alert, Badge, Button, Card, CardBody, EmptyState, Skeleton } from '@namo/ui';
import { api } from '@/lib/api';

export default function SelectQuestionnairePage() {
  const params = useParams<{ childId: string }>();
  const router = useRouter();
  const childId = params.childId;
  const [error, setError] = useState<string | null>(null);

  const childQuery = useQuery({
    queryKey: ['child', childId],
    queryFn: () => api().getChild(childId),
  });
  const questionnairesQuery = useQuery({
    queryKey: ['questionnaires-for-child', childId],
    queryFn: () => api().questionnairesForChild(childId),
  });

  const startMutation = useMutation({
    mutationFn: (questionnaireId: string) => api().startAssessment({ childId, questionnaireId }),
    onSuccess: (assessment) => router.push(`/assessments/${assessment.id}`),
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'Could not start the check-in.'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href={`/children/${childId}`}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Back
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
          Choose a check-in
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          These check-ins are matched to{' '}
          {childQuery.data ? childQuery.data.firstName : 'your child'}&apos;s age.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {questionnairesQuery.isLoading && <Skeleton className="h-32" />}
      {questionnairesQuery.isError && (
        <Alert variant="error">We couldn&apos;t load the check-ins right now.</Alert>
      )}

      {questionnairesQuery.data && questionnairesQuery.data.length === 0 && (
        <EmptyState
          icon="🗓️"
          title="No check-ins available yet"
          description="There isn't a check-in for this age range at the moment. Please look again soon."
        />
      )}

      {questionnairesQuery.data?.map((questionnaire) => (
        <Card key={questionnaire.id}>
          <CardBody className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-ink">{questionnaire.title}</h2>
                {questionnaire.description && (
                  <p className="mt-1 text-sm text-ink-muted">{questionnaire.description}</p>
                )}
              </div>
              <Badge tone="teal">
                {questionnaire.ageMinMonths}–{questionnaire.ageMaxMonths} mo
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {questionnaire.domainCount} areas · {questionnaire.questionCount} questions
              </span>
              <Button
                onClick={() => {
                  setError(null);
                  startMutation.mutate(questionnaire.id);
                }}
                loading={startMutation.isPending && startMutation.variables === questionnaire.id}
              >
                Begin
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
