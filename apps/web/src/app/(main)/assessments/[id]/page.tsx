'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  ApiError,
  type AssessmentDetail,
  type DomainView,
  type QuestionnaireDetail,
  type QuestionView,
  type ResponseValue,
} from '@namo/api-client';
import { Alert, Button, Card, CardBody, ProgressBar, Skeleton, ZoneBadge } from '@namo/ui';
import { api } from '@/lib/api';

type AnswerOption = {
  value: ResponseValue;
  label: string;
  emoji: string;
  xp: number;
  cheer: string;
  selected: string;
  ring: string;
};

const OPTIONS: AnswerOption[] = [
  {
    value: 'YES',
    label: 'Yes, often',
    emoji: '✨',
    xp: 10,
    cheer: 'Brilliant!',
    selected: 'border-teal-500 bg-teal-500 text-white shadow-glow-lg',
    ring: 'focus-visible:ring-teal-300/60',
  },
  {
    value: 'SOMETIMES',
    label: 'Sometimes',
    emoji: '🌱',
    xp: 5,
    cheer: 'Lovely!',
    selected: 'border-gold-500 bg-gold-500 text-white shadow-glow-lg',
    ring: 'focus-visible:ring-gold-400/50',
  },
  {
    value: 'NOT_YET',
    label: 'Not yet',
    emoji: '🌼',
    xp: 0,
    cheer: 'That’s okay!',
    selected: 'border-clay-500 bg-clay-500 text-white shadow-glow-lg',
    ring: 'focus-visible:ring-clay-400/50',
  },
];

const XP_BY_VALUE: Record<ResponseValue, number> = { YES: 10, SOMETIMES: 5, NOT_YET: 0 };

const DOMAIN_PALETTE = [
  { emoji: '💬', tone: 'from-primary-400 to-clay-500', chip: 'bg-primary-50 text-primary-700' },
  { emoji: '🤸', tone: 'from-teal-400 to-teal-600', chip: 'bg-teal-50 text-teal-700' },
  { emoji: '✋', tone: 'from-gold-400 to-clay-500', chip: 'bg-gold-400/15 text-gold-600' },
  { emoji: '🧩', tone: 'from-dusk-400 to-dusk-600', chip: 'bg-dusk-100 text-dusk-600' },
  { emoji: '🧸', tone: 'from-clay-400 to-primary-500', chip: 'bg-clay-400/15 text-clay-600' },
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

type FlatQuestion = QuestionView & {
  domain: DomainView;
  domainIndex: number;
  positionInDomain: number;
  domainTotal: number;
};

function flattenQuestions(questionnaire: QuestionnaireDetail): FlatQuestion[] {
  return questionnaire.domains.flatMap((domain, domainIndex) =>
    domain.questions.map((question, positionInDomain) => ({
      ...question,
      domain,
      domainIndex,
      positionInDomain,
      domainTotal: domain.questions.length,
    })),
  );
}

function Runner({
  assessment,
  questionnaire,
}: {
  assessment: AssessmentDetail;
  questionnaire: QuestionnaireDetail;
}) {
  const queryClient = useQueryClient();
  const questions = useMemo(() => flattenQuestions(questionnaire), [questionnaire]);
  const total = questions.length;

  const [answers, setAnswers] = useState<Record<string, ResponseValue>>(() =>
    Object.fromEntries(assessment.responses.map((r) => [r.questionId, r.value])),
  );
  const [currentIndex, setCurrentIndex] = useState(() => {
    const firstUnanswered = questions.findIndex((q) => !assessment.responses.some((r) => r.questionId === q.id));
    return firstUnanswered === -1 ? Math.max(0, total - 1) : firstUnanswered;
  });
  const [xpPop, setXpPop] = useState<{ key: number; xp: number; cheer: string; emoji: string } | null>(null);
  const [levelUp, setLevelUp] = useState<{ key: number; from: DomainView; to: DomainView } | null>(null);
  const [cardKey, setCardKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const levelUpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (xpTimer.current) clearTimeout(xpTimer.current);
      if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
    },
    [],
  );

  const answeredCount = questions.filter((q) => answers[q.id]).length;
  const earnedXp = questions.reduce((sum, q) => sum + (answers[q.id] ? XP_BY_VALUE[answers[q.id]!] : 0), 0);
  const maxXp = total * 10;
  const streak = useMemo(() => {
    let count = 0;
    for (let i = currentIndex - 1; i >= 0; i -= 1) {
      const value = answers[questions[i]!.id];
      if (value === 'YES' || value === 'SOMETIMES') count += 1;
      else break;
    }
    return count;
  }, [answers, currentIndex, questions]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const responses = questions
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

  const atFinishLine = currentIndex >= total;
  const current = !atFinishLine ? questions[currentIndex] : undefined;
  const domainPalette = current
    ? DOMAIN_PALETTE[current.domainIndex % DOMAIN_PALETTE.length]!
    : DOMAIN_PALETTE[0]!;
  const isComplete = answeredCount === total && total > 0;

  function handleAnswer(option: AnswerOption) {
    if (!current) return;
    const previous = answers[current.id];
    setAnswers((prev) => ({ ...prev, [current.id]: option.value }));
    if (previous !== option.value) {
      if (xpTimer.current) clearTimeout(xpTimer.current);
      setXpPop({ key: Date.now(), xp: option.xp, cheer: option.cheer, emoji: option.emoji });
      xpTimer.current = setTimeout(() => setXpPop(null), 1100);
    }
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => advance(), 380);
  }

  function advance() {
    if (!current) return;
    const nextIndex = currentIndex + 1;
    const nextQuestion = questions[nextIndex];
    if (nextQuestion && nextQuestion.domainIndex !== current.domainIndex) {
      setLevelUp({
        key: Date.now(),
        from: current.domain,
        to: nextQuestion.domain,
      });
      if (levelUpTimer.current) clearTimeout(levelUpTimer.current);
      levelUpTimer.current = setTimeout(() => {
        setLevelUp(null);
        setCurrentIndex(nextIndex);
        setCardKey((k) => k + 1);
      }, 1500);
      return;
    }
    setCurrentIndex(nextIndex);
    setCardKey((k) => k + 1);
  }

  function goPrevious() {
    if (currentIndex === 0) return;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setCurrentIndex((i) => Math.max(0, i - 1));
    setCardKey((k) => k + 1);
  }

  function jumpTo(index: number) {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setCurrentIndex(index);
    setCardKey((k) => k + 1);
  }

  const currentDomainIndex = current?.domainIndex ?? questionnaire.domains.length - 1;
  const overallPct = Math.round((answeredCount / Math.max(1, total)) * 100);

  return (
    <div className="space-y-5 pb-28">
      <div className="flex items-center justify-between gap-4">
        <Link
          href={`/children/${assessment.childId}`}
          className="text-sm font-medium text-ink-muted transition hover:text-ink"
        >
          ← Save & exit
        </Link>
        <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold ${domainPalette.chip}`}>
          <span aria-hidden="true">{domainPalette.emoji}</span>
          {current ? current.domain.name : 'All areas complete'}
        </span>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Stage */}
        <div className="relative order-2 lg:order-1">
          {levelUp ? (
            <LevelUpCard key={levelUp.key} from={levelUp.from} to={levelUp.to} />
          ) : atFinishLine ? (
            <FinishCard
              key="finish"
              earnedXp={earnedXp}
              maxXp={maxXp}
              total={total}
              isComplete={isComplete}
              isSubmitting={submitMutation.isPending}
              onSubmit={() => {
                setError(null);
                submitMutation.mutate();
              }}
              onReview={() => jumpTo(Math.max(0, total - 1))}
            />
          ) : current ? (
            <QuestionCard
              key={cardKey}
              question={current}
              selected={answers[current.id]}
              palette={domainPalette}
              onAnswer={handleAnswer}
              xpPop={xpPop}
            />
          ) : null}
        </div>

        {/* Side rail: HUD + domain map */}
        <aside className="order-1 space-y-5 lg:order-2 lg:sticky lg:top-24 lg:self-start">
          <section className="namo-glass relative overflow-hidden rounded-3xl p-5 shadow-glow">
            <div
              className={`absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${domainPalette.tone} opacity-15 blur-3xl transition-all duration-700`}
              aria-hidden="true"
            />
            <div className="relative">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {questionnaire.title}
              </p>
              <p className="mt-1 font-display text-lg font-medium tracking-tight text-ink">
                Level {Math.min(currentDomainIndex, questionnaire.domains.length - 1) + 1} of {questionnaire.domains.length} ·{' '}
                <span className="text-ink-muted">{current?.domain.name ?? 'Finishing up'}</span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Stat icon="⭐" label="XP" value={`${earnedXp} / ${maxXp}`} tone="bg-primary-50 text-primary-700" />
                <Stat icon="🔥" label="Streak" value={`${streak}`} tone="bg-clay-400/15 text-clay-600" />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
                  <span>
                    Question {Math.min(currentIndex + 1, total)} of {total}
                  </span>
                  <span>{overallPct}%</span>
                </div>
                <ProgressBar value={answeredCount} max={total} tone="primary" />
              </div>
            </div>
          </section>

          <DomainMap
            domains={questionnaire.domains}
            questions={questions}
            answers={answers}
            currentDomainIndex={currentDomainIndex}
            atFinishLine={atFinishLine}
            onJumpToDomain={(domainIndex) => {
              const target = questions.findIndex(
                (q) => q.domainIndex === domainIndex && !answers[q.id],
              );
              if (target >= 0) jumpTo(target);
              else {
                const first = questions.findIndex((q) => q.domainIndex === domainIndex);
                if (first >= 0) jumpTo(first);
              }
            }}
          />
        </aside>
      </div>

      {/* Footer nav */}
      <div className="namo-glass fixed inset-x-0 bottom-0 z-10 border-t border-white/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={goPrevious}
            disabled={currentIndex === 0 || Boolean(levelUp)}
            className="rounded-full px-4 py-2 text-sm font-medium text-ink-muted transition hover:bg-sand-200 hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            ← Previous
          </button>
          <DotProgress questions={questions} answers={answers} currentIndex={currentIndex} onJump={jumpTo} />
          {atFinishLine ? (
            <Button
              onClick={() => {
                setError(null);
                submitMutation.mutate();
              }}
              disabled={!isComplete}
              loading={submitMutation.isPending}
            >
              See results →
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => jumpTo(Math.min(total, currentIndex + 1))}
              disabled={!answers[current?.id ?? '']}
            >
              Skip →
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DomainMap({
  domains,
  questions,
  answers,
  currentDomainIndex,
  atFinishLine,
  onJumpToDomain,
}: {
  domains: DomainView[];
  questions: FlatQuestion[];
  answers: Record<string, ResponseValue>;
  currentDomainIndex: number;
  atFinishLine: boolean;
  onJumpToDomain: (domainIndex: number) => void;
}) {
  const summary = domains.map((domain, i) => {
    const inDomain = questions.filter((q) => q.domainIndex === i);
    const answered = inDomain.filter((q) => answers[q.id]).length;
    const total = inDomain.length;
    const isCurrent = !atFinishLine && i === currentDomainIndex;
    const isComplete = answered === total && total > 0;
    return { domain, i, answered, total, isCurrent, isComplete };
  });

  return (
    <section className="namo-glass rounded-3xl p-5 shadow-soft">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
        Quest map
      </p>
      <ol className="mt-3 space-y-2">
        {summary.map(({ domain, i, answered, total, isCurrent, isComplete }) => {
          const palette = DOMAIN_PALETTE[i % DOMAIN_PALETTE.length]!;
          const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
          return (
            <li key={domain.id}>
              <button
                type="button"
                onClick={() => onJumpToDomain(i)}
                className={`group flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                  isCurrent
                    ? 'border-primary-200 bg-primary-50/60 shadow-soft'
                    : 'border-transparent hover:border-sand-200 hover:bg-sand-100'
                }`}
              >
                <span
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base text-white shadow-glow bg-gradient-to-br ${palette.tone} ${isComplete ? '' : isCurrent ? '' : 'opacity-60'}`}
                >
                  {isComplete ? '✓' : palette.emoji}
                  {isCurrent && (
                    <span
                      className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br opacity-50 blur-md"
                      style={{ backgroundImage: 'inherit' }}
                      aria-hidden="true"
                    />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`truncate text-sm font-semibold ${isCurrent ? 'text-ink' : 'text-ink-muted'}`}>
                      {domain.name}
                    </p>
                    <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-ink-soft">
                      {answered}/{total}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${palette.tone} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Stat({ icon, label, value, tone }: { icon: string; label: string; value: string; tone: string }) {
  return (
    <div className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold ${tone}`}>
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <div className="leading-tight">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider opacity-80">{label}</p>
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function QuestionCard({
  question,
  selected,
  palette,
  onAnswer,
  xpPop,
}: {
  question: FlatQuestion;
  selected: ResponseValue | undefined;
  palette: (typeof DOMAIN_PALETTE)[number];
  onAnswer: (option: AnswerOption) => void;
  xpPop: { key: number; xp: number; cheer: string; emoji: string } | null;
}) {
  return (
    <div className="relative animate-card-in">
      <Card className="relative overflow-hidden">
        <div
          className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-br ${palette.tone} opacity-[0.12]`}
          aria-hidden="true"
        />
        <CardBody className="relative space-y-6 sm:space-y-7">
          <div className="flex items-start gap-4">
            <div className="relative shrink-0">
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${palette.tone} text-2xl text-white shadow-glow-lg`}
              >
                {palette.emoji}
              </span>
              <span
                className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${palette.tone} opacity-40 blur-md`}
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-soft">
                {question.domain.name} · {question.positionInDomain + 1} of {question.domainTotal}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-medium leading-snug tracking-tight text-ink sm:text-3xl">
                {question.text}
              </h2>
              {question.helpText && (
                <p className="mt-3 rounded-xl bg-sand-100 px-3.5 py-2.5 text-sm leading-relaxed text-ink-muted">
                  💡 {question.helpText}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {OPTIONS.map((option) => {
              const active = selected === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onAnswer(option)}
                  className={`group relative flex flex-col items-center gap-2 rounded-2xl border px-4 py-5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 ${option.ring} ${
                    active
                      ? option.selected
                      : 'border-sand-200 bg-surface text-ink hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-glow'
                  }`}
                >
                  <span className={`text-3xl transition-transform duration-300 ${active ? 'animate-pop' : 'group-hover:scale-110'}`} aria-hidden="true">
                    {option.emoji}
                  </span>
                  <span>{option.label}</span>
                  <span
                    className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${
                      active ? 'bg-white/25 text-white' : 'bg-sand-100 text-ink-soft'
                    }`}
                  >
                    +{option.xp} XP
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {xpPop && (
        <div
          key={xpPop.key}
          className="pointer-events-none absolute left-1/2 top-6 z-20 -translate-x-1/2 animate-xp-float"
          aria-hidden="true"
        >
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-glow-lg">
            <span className="text-lg">{xpPop.emoji}</span>
            <span>{xpPop.cheer}</span>
            {xpPop.xp > 0 && <span className="text-gold-400">+{xpPop.xp} XP</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function paletteFor(domain: DomainView): (typeof DOMAIN_PALETTE)[number] {
  const idx = Math.max(0, (domain.order ?? 1) - 1);
  return DOMAIN_PALETTE[idx % DOMAIN_PALETTE.length]!;
}

function LevelUpCard({ from, to }: { from: DomainView; to: DomainView }) {
  const fromTone = paletteFor(from);
  const toTone = paletteFor(to);

  return (
    <Card className="relative overflow-hidden animate-card-in">
      <div className="absolute inset-0 namo-aurora opacity-60" aria-hidden="true" />
      <CardBody className="relative flex flex-col items-center gap-5 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
          Level complete
        </p>
        <h2 className="font-display text-3xl font-medium text-ink sm:text-4xl">
          You unlocked a new area ✨
        </h2>
        <div className="flex items-center gap-3 sm:gap-5">
          <DomainChip emoji={fromTone.emoji} name={from.name} tone={fromTone.chip} muted />
          <span className="text-2xl text-ink-soft" aria-hidden="true">
            →
          </span>
          <DomainChip emoji={toTone.emoji} name={to.name} tone={toTone.chip} />
        </div>
        <p className="max-w-md text-sm text-ink-muted">
          Keep going — every answer helps us understand your child a little better.
        </p>
      </CardBody>
    </Card>
  );
}

function DomainChip({
  emoji,
  name,
  tone,
  muted,
}: {
  emoji: string;
  name: string;
  tone: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${tone} ${muted ? 'opacity-50' : 'animate-pop shadow-glow'}`}
    >
      <span className="text-lg" aria-hidden="true">
        {emoji}
      </span>
      {name}
    </div>
  );
}

function FinishCard({
  earnedXp,
  maxXp,
  total,
  isComplete,
  isSubmitting,
  onSubmit,
  onReview,
}: {
  earnedXp: number;
  maxXp: number;
  total: number;
  isComplete: boolean;
  isSubmitting: boolean;
  onSubmit: () => void;
  onReview: () => void;
}) {
  return (
    <Card className="relative overflow-hidden animate-card-in">
      <div className="absolute inset-0 namo-aurora opacity-50" aria-hidden="true" />
      <CardBody className="relative flex flex-col items-center gap-5 py-12 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-clay-500 text-4xl text-white shadow-float animate-pop">
          🏁
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600">
            You did it
          </p>
          <h2 className="mt-2 font-display text-3xl font-medium text-ink sm:text-4xl">
            All {total} questions answered
          </h2>
          <p className="mt-2 max-w-md text-sm text-ink-muted">
            You earned <span className="font-semibold text-ink">{earnedXp} XP</span> out of {maxXp}. Submit when you&apos;re ready to see your child&apos;s results.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={onReview} variant="ghost">
            Review answers
          </Button>
          <Button onClick={onSubmit} disabled={!isComplete} loading={isSubmitting} size="lg">
            See results ✨
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function DotProgress({
  questions,
  answers,
  currentIndex,
  onJump,
}: {
  questions: FlatQuestion[];
  answers: Record<string, ResponseValue>;
  currentIndex: number;
  onJump: (index: number) => void;
}) {
  // Compact: only render the current domain's dots to avoid overflow on long surveys.
  const currentDomainIndex = questions[Math.min(currentIndex, questions.length - 1)]?.domainIndex ?? 0;
  const domainQuestions = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q }) => q.domainIndex === currentDomainIndex);

  return (
    <div className="hidden flex-1 items-center justify-center gap-1.5 sm:flex">
      {domainQuestions.map(({ q, i }) => {
        const active = i === currentIndex;
        const answered = Boolean(answers[q.id]);
        return (
          <button
            key={q.id}
            type="button"
            aria-label={`Go to question ${i + 1}`}
            onClick={() => onJump(i)}
            className={`h-2 rounded-full transition-all ${
              active
                ? 'w-6 bg-primary-500'
                : answered
                  ? 'w-2 bg-teal-400 hover:bg-teal-500'
                  : 'w-2 bg-sand-300 hover:bg-sand-400'
            }`}
          />
        );
      })}
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const angle = (i / 28) * Math.PI * 2;
        const radius = 140 + ((i * 37) % 90);
        const colors = ['#d9762b', '#2f7468', '#d4a03a', '#bf6342', '#5b7894'];
        return {
          color: colors[i % colors.length]!,
          cx: `${Math.cos(angle) * radius}px`,
          cy: `${Math.sin(angle) * (radius * 0.6) + 220}px`,
          rotate: `${(i * 47) % 720}deg`,
          delay: `${(i % 6) * 60}ms`,
          left: `${44 + ((i * 11) % 12)}%`,
        };
      }),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, idx) => {
        const style: CSSProperties = {
          left: p.left,
          background: p.color,
          animationDelay: p.delay,
        };
        (style as Record<string, string>)['--cx'] = p.cx;
        (style as Record<string, string>)['--cy'] = p.cy;
        (style as Record<string, string>)['--cr'] = p.rotate;
        return <span key={idx} className="namo-confetti-piece" style={style} />;
      })}
    </div>
  );
}

function ResultView({ assessment }: { assessment: AssessmentDetail }) {
  const zone = assessment.overallZone ?? 'NORMAL';
  const score = assessment.totalScore ?? 0;
  const maxScore = assessment.totalMaxScore ?? 0;
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href={`/children/${assessment.childId}`}
        className="text-sm font-medium text-ink-muted hover:text-ink"
      >
        ← Back to child
      </Link>

      <div className="namo-glass relative overflow-hidden rounded-3xl p-8 text-center shadow-float sm:p-10">
        <Confetti />
        <div className="absolute inset-0 namo-aurora opacity-50" aria-hidden="true" />
        <div
          className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-teal-100/70 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-primary-100/60 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative">
          <div className="relative mx-auto inline-flex">
            <span className="absolute inset-0 rounded-full bg-primary-200/50 animate-pulse-ring" aria-hidden="true" />
            <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-clay-500 text-4xl text-white shadow-glow-lg animate-pop">
              {ZONE_EMOJI[zone]}
            </span>
          </div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            Check-in complete · {pct}% earned
          </p>
          <div className="mt-3 flex justify-center">
            <ZoneBadge zone={zone} />
          </div>
          <p className="mt-4 font-display text-5xl font-medium text-ink sm:text-6xl">
            {score}
            <span className="text-2xl text-ink-soft"> / {maxScore} XP</span>
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
        {assessment.domainScores.map((domain, i) => {
          const palette = DOMAIN_PALETTE[i % DOMAIN_PALETTE.length]!;
          const domainPct = domain.maxScore > 0 ? Math.round((domain.rawScore / domain.maxScore) * 100) : 0;
          return (
            <Card key={domain.domainId} className="relative overflow-hidden">
              <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${palette.tone}`} aria-hidden="true" />
              <CardBody className="space-y-3 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${palette.tone} text-lg text-white shadow-glow`}>
                      {palette.emoji}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">{domain.domainName}</p>
                      <p className="text-xs text-ink-soft">{domainPct}% earned</p>
                    </div>
                  </div>
                  <ZoneBadge zone={domain.zone} />
                </div>
                <ProgressBar value={domain.rawScore} max={domain.maxScore} />
                <p className="text-xs text-ink-soft">
                  {domain.rawScore} of {domain.maxScore} points
                </p>
              </CardBody>
            </Card>
          );
        })}
      </section>

      <Alert variant="info">
        Namo supports your parenting — it does not replace professional medical advice. Share these
        results with your pediatrician if you have any concerns.
      </Alert>
    </div>
  );
}
