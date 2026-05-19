'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  ApiError,
  type AssessmentDetail,
  type QuestionnaireDetail,
  type ResponseValue,
} from '@namo/api-client';
import { Alert, Button, Card, CardBody, ProgressBar, Skeleton, ZoneBadge } from '@namo/ui';
import { api } from '@/lib/api';

const OPTIONS: { value: ResponseValue; label: string; selected: string }[] = [
  { value: 'YES', label: 'Yes', selected: 'border-teal-500 bg-teal-500 text-white' },
  { value: 'SOMETIMES', label: 'Sometimes', selected: 'border-gold-500 bg-gold-500 text-white' },
  { value: 'NOT_YET', label: 'Not yet', selected: 'border-clay-500 bg-clay-500 text-white' },
];

const ZONE_EMOJI: Record<string, string> = {
  NORMAL: '🌟',
  GREY_ZONE: '🌼',
  DELAY: '🤝',
};

const ZONE_MESSAGE: Record<string, string> = {
  NORMAL:
    'Wonderful — your child is developing right on track. Keep enjoying everyday play together.',
  GREY_ZONE:
    'A few areas are worth keeping an eye on. Try simple daily activities and check in again soon.',
  DELAY:
    'Some areas may benefit from extra support. Consider sharing these results with your pediatrician.',
};

export default function AssessmentPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const assessmentQuery = useQuery({
    queryKey: ['assessment', id],
    queryFn: () => api().getAssessment(id),
  });
  const assessment = assessmentQuery.data;

  const questionnaireQuery = useQuery({
    queryKey: ['questionnaire', assessment?.questionnaireId],
    queryFn: () => api().getQuestionnaire(assessment?.questionnaireId ?? ''),
    enabled: Boolean(assessment),
  });

  if (assessmentQuery.isLoading) {
    return <Skeleton className="mx-auto h-64 max-w-2xl" />;
  }
  if (assessmentQuery.isError || !assessment) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert variant="error">We couldn&apos;t load this check-in.</Alert>
      </div>
    );
  }
  if (assessment.status === 'COMPLETED') {
    return <ResultView assessment={assessment} />;
  }
  if (questionnaireQuery.isLoading) {
    return <Skeleton className="mx-auto h-64 max-w-2xl" />;
  }
  if (!questionnaireQuery.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <Alert variant="error">We couldn&apos;t load the questions.</Alert>
      </div>
    );
  }
  return <Runner assessment={assessment} questionnaire={questionnaireQuery.data} />;
}

function Runner({
  assessment,
  questionnaire,
}: {
  assessment: AssessmentDetail;
  questionnaire: QuestionnaireDetail;
}) {
  const queryClient = useQueryClient();
  const [answers, setAnswers] = useState<Record<string, ResponseValue>>(() =>
    Object.fromEntries(assessment.responses.map((r) => [r.questionId, r.value])),
  );
  const [error, setError] = useState<string | null>(null);

  const allQuestions = questionnaire.domains.flatMap((domain) => domain.questions);
  const total = allQuestions.length;
  const answeredCount = allQuestions.filter((question) => answers[question.id]).length;
  const isComplete = answeredCount === total && total > 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const responses = allQuestions
        .map((question) => ({ questionId: question.id, value: answers[question.id] }))
        .filter((r): r is { questionId: string; value: ResponseValue } => Boolean(r.value));
      await api().submitResponses(assessment.id, { responses });
      return api().completeAssessment(assessment.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['assessment', assessment.id] });
      await queryClient.invalidateQueries({ queryKey: ['assessments', assessment.childId] });
    },
    onError: (err) =>
      setError(err instanceof ApiError ? err.message : 'We could not save your answers.'),
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-28">
      <div>
        <Link
          href={`/children/${assessment.childId}`}
          className="text-sm font-medium text-ink-muted hover:text-ink"
        >
          ← Back
        </Link>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-ink">
          {questionnaire.title}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Choose the answer that feels closest. There are no wrong answers.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {questionnaire.domains.map((domain) => (
        <Card key={domain.id}>
          <CardBody className="space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-primary-600">
              {domain.name}
            </h2>
            {domain.questions.map((question) => (
              <div key={question.id} className="space-y-2.5 border-t border-sand-200 pt-4 first:border-0 first:pt-0">
                <p className="text-sm text-ink">{question.text}</p>
                {question.helpText && (
                  <p className="text-xs text-ink-soft">{question.helpText}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  {OPTIONS.map((option) => {
                    const active = answers[question.id] === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({ ...prev, [question.id]: option.value }))
                        }
                        className={`h-11 rounded-full border px-5 text-sm font-medium transition-all ${
                          active
                            ? option.selected
                            : 'border-sand-300 bg-surface text-ink-muted hover:border-sand-400'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      ))}

      <div className="fixed inset-x-0 bottom-0 border-t border-sand-200 bg-sand-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3 sm:px-6">
          <div className="flex-1">
            <p className="mb-1 text-xs font-medium text-ink-muted">
              {answeredCount} of {total} answered
            </p>
            <ProgressBar value={answeredCount} max={total} />
          </div>
          <Button
            onClick={() => {
              setError(null);
              submitMutation.mutate();
            }}
            disabled={!isComplete}
            loading={submitMutation.isPending}
          >
            See results
          </Button>
        </div>
      </div>
    </div>
  );
}

function ResultView({ assessment }: { assessment: AssessmentDetail }) {
  const zone = assessment.overallZone ?? 'NORMAL';

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href={`/children/${assessment.childId}`}
        className="text-sm font-medium text-ink-muted hover:text-ink"
      >
        ← Back to child
      </Link>

      <div className="relative overflow-hidden rounded-3xl border border-sand-200 bg-surface p-8 text-center shadow-soft">
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-100/70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-primary-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <p className="text-3xl">{ZONE_EMOJI[zone]}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            Check-in complete
          </p>
          <div className="mt-3 flex justify-center">
            <ZoneBadge zone={zone} />
          </div>
          <p className="mt-4 font-display text-5xl font-medium text-ink">
            {assessment.totalScore ?? 0}
            <span className="text-2xl text-ink-soft"> / {assessment.totalMaxScore ?? 0}</span>
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
            {ZONE_MESSAGE[zone]}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
          By developmental area
        </h2>
        {assessment.domainScores.map((domain) => (
          <Card key={domain.domainId}>
            <CardBody className="space-y-3 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-ink">{domain.domainName}</p>
                <ZoneBadge zone={domain.zone} />
              </div>
              <ProgressBar value={domain.rawScore} max={domain.maxScore} />
              <p className="text-xs text-ink-soft">
                {domain.rawScore} of {domain.maxScore} points
              </p>
            </CardBody>
          </Card>
        ))}
      </section>

      <Alert variant="info">
        Namo supports your parenting — it does not replace professional medical advice. Share these
        results with your pediatrician if you have any concerns.
      </Alert>
    </div>
  );
}
