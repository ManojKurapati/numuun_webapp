'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@namo/api-client';
import { Alert, Button, Card, CardBody, EmptyState, Skeleton } from '@namo/ui';
import { api } from '@/lib/api';

const QUESTIONNAIRE_PALETTES = [
  { emoji: '🌱', tone: 'from-teal-400 to-teal-600', chip: 'bg-teal-50 text-teal-700' },
  { emoji: '🌼', tone: 'from-primary-400 to-clay-500', chip: 'bg-primary-50 text-primary-700' },
  { emoji: '✨', tone: 'from-gold-400 to-clay-500', chip: 'bg-gold-400/15 text-gold-600' },
  { emoji: '🪁', tone: 'from-dusk-400 to-dusk-600', chip: 'bg-dusk-100 text-dusk-600' },
  { emoji: '🌟', tone: 'from-clay-400 to-primary-500', chip: 'bg-clay-400/15 text-clay-600' },
];

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

  const childName = childQuery.data ? childQuery.data.firstName : 'your child';

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/children/${childId}`}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Back
        </Link>
        <section className="namo-glass relative mt-3 overflow-hidden rounded-3xl p-7 shadow-glow sm:p-8">
          <div className="absolute inset-0 namo-aurora opacity-50" aria-hidden="true" />
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-primary-100/70 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-teal-100/60 blur-3xl" aria-hidden="true" />
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
              Ready when you are
            </p>
            <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink sm:text-4xl">
              Choose a check-in for {childName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
              Each quest is matched to {childName}&apos;s age. Answer one card at a time, earn XP for
              every milestone, and unlock a snapshot of how they&apos;re growing.
            </p>
          </div>
        </section>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {questionnairesQuery.isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      )}
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {questionnairesQuery.data?.map((questionnaire, i) => {
          const palette = QUESTIONNAIRE_PALETTES[i % QUESTIONNAIRE_PALETTES.length]!;
          const xpEstimate = questionnaire.questionCount * 10;
          return (
            <Card
              key={questionnaire.id}
              className="group relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-float"
            >
              <div
                className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-br ${palette.tone} opacity-[0.14] transition-opacity duration-300 group-hover:opacity-25`}
                aria-hidden="true"
              />
              <CardBody className="relative flex h-full flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${palette.tone} text-2xl text-white shadow-glow-lg`}
                      >
                        {palette.emoji}
                      </span>
                      <span
                        className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${palette.tone} opacity-50 blur-md`}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-medium text-ink">
                        {questionnaire.title}
                      </h2>
                      <p className={`mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-[0.7rem] font-semibold ${palette.chip}`}>
                        Ages {questionnaire.ageMinMonths}–{questionnaire.ageMaxMonths} mo
                      </p>
                    </div>
                  </div>
                </div>

                {questionnaire.description && (
                  <p className="text-sm leading-relaxed text-ink-muted">{questionnaire.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 rounded-2xl bg-sand-100/80 p-3 text-center">
                  <Metric label="Areas" value={`${questionnaire.domainCount}`} />
                  <Metric label="Questions" value={`${questionnaire.questionCount}`} />
                  <Metric label="Max XP" value={`${xpEstimate}`} accent />
                </div>

                <div className="mt-auto flex items-center justify-between gap-3">
                  <p className="text-xs text-ink-soft">≈ {Math.max(3, Math.round(questionnaire.questionCount * 0.4))} min · gentle pace</p>
                  <Button
                    onClick={() => {
                      setError(null);
                      startMutation.mutate(questionnaire.id);
                    }}
                    loading={startMutation.isPending && startMutation.variables === questionnaire.id}
                  >
                    Begin quest →
                  </Button>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-display text-xl font-semibold ${accent ? 'text-primary-600' : 'text-ink'}`}>
        {value}
      </p>
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
    </div>
  );
}
