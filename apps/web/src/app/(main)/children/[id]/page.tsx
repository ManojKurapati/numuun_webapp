'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Badge, Button, EmptyState, Skeleton, ZoneBadge } from '@namo/ui';
import { api } from '@/lib/api';
import { ageLabel, formatDate } from '@/lib/format';

export default function ChildDetailPage() {
  const params = useParams<{ id: string }>();
  const childId = params.id;

  const childQuery = useQuery({
    queryKey: ['child', childId],
    queryFn: () => api().getChild(childId),
  });
  const assessmentsQuery = useQuery({
    queryKey: ['assessments', childId],
    queryFn: () => api().listAssessments(childId),
  });

  const child = childQuery.data;
  const assessments = assessmentsQuery.data;
  const completed = assessments?.filter((a) => a.status === 'COMPLETED').length ?? 0;

  return (
    <div className="space-y-8">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-ink-muted transition hover:text-ink"
      >
        ← All children
      </Link>

      {childQuery.isLoading && <Skeleton className="h-44 rounded-3xl" />}
      {childQuery.isError && <Alert variant="error">We couldn&apos;t load this child.</Alert>}

      {child && (
        <>
          {/* Child hero */}
          <section className="namo-glass relative overflow-hidden rounded-3xl p-7 shadow-glow sm:p-8">
            <div className="absolute inset-0 namo-aurora opacity-50" aria-hidden="true" />
            <div
              className="absolute -right-14 -top-14 h-48 w-48 rounded-full bg-primary-100/70 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-teal-100/60 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-clay-500 text-2xl font-semibold text-white shadow-glow-lg">
                    {child.firstName.charAt(0).toUpperCase()}
                  </span>
                  <span className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br from-primary-400 to-clay-500 opacity-40 blur-md" aria-hidden="true" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-3xl">
                    {child.firstName} {child.lastName ?? ''}
                  </h1>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {ageLabel(child.ageMonths)} · born {formatDate(child.dateOfBirth)}
                  </p>
                  {completed > 0 && (
                    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
                      <span aria-hidden="true">🏆</span> {completed} quest{completed === 1 ? '' : 's'} completed
                    </span>
                  )}
                </div>
              </div>
              <Link href={`/assess/${child.id}`}>
                <Button size="lg">Start a check-in</Button>
              </Link>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Check-in history
            </h2>

            {assessmentsQuery.isLoading && <Skeleton className="h-24 rounded-2xl" />}
            {assessments && assessments.length === 0 && (
              <EmptyState
                icon="📋"
                title="No check-ins yet"
                description="Start a check-in to see how your child is developing across the five areas."
                action={
                  <Link href={`/assess/${child.id}`}>
                    <Button>Start the first check-in</Button>
                  </Link>
                }
              />
            )}

            {assessments && assessments.length > 0 && (
              <div className="space-y-3">
                {assessments.map((assessment) => (
                  <Link key={assessment.id} href={`/assessments/${assessment.id}`} className="group block">
                    <div className="namo-glass flex items-center justify-between gap-4 rounded-2xl p-5 shadow-soft transition-all duration-200 group-hover:-translate-y-0.5 group-hover:shadow-glow-lg sm:p-6">
                      <div className="flex items-center gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sand-100 text-lg">
                          {assessment.status === 'COMPLETED' ? '✅' : '✏️'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-ink">
                            Check-in · {formatDate(assessment.createdAt)}
                          </p>
                          <p className="text-xs text-ink-muted">
                            {assessment.status === 'COMPLETED'
                              ? `Completed · ${assessment.totalScore ?? 0} / ${assessment.totalMaxScore ?? 0} points`
                              : `In progress · ${assessment.progress.answered} of ${assessment.progress.total} answered`}
                          </p>
                        </div>
                      </div>
                      {assessment.status === 'COMPLETED' && assessment.overallZone ? (
                        <ZoneBadge zone={assessment.overallZone} />
                      ) : (
                        <Badge tone="primary">In progress</Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
