'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Badge, Card, EmptyState, PageHeader, Skeleton, ZoneBadge } from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';

export default function AdminAssessmentsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-assessments'],
    queryFn: () => api().adminAssessments({ pageSize: 100 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Assessments" description="Developmental check-ins completed and in progress." />

      {isLoading && <Skeleton className="h-64" />}
      {isError && <Alert variant="error">We couldn&apos;t load assessments.</Alert>}

      {data && data.items.length === 0 && (
        <EmptyState icon="📊" title="No assessments yet" description="Check-ins appear here as parents complete them." />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Child age</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Outcome</th>
                  <th className="px-6 py-3 font-medium">Started</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((assessment) => (
                  <tr key={assessment.id} className="border-b border-sand-200 last:border-0">
                    <td className="px-6 py-4">
                      <Badge tone={assessment.status === 'COMPLETED' ? 'teal' : 'primary'}>
                        {assessment.status === 'COMPLETED' ? 'Completed' : 'In progress'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-ink-muted">{assessment.childAgeMonths} months</td>
                    <td className="px-6 py-4 text-ink-muted">
                      {assessment.totalScore != null
                        ? `${assessment.totalScore} / ${assessment.totalMaxScore ?? 0}`
                        : '—'}
                    </td>
                    <td className="px-6 py-4">
                      {assessment.overallZone ? <ZoneBadge zone={assessment.overallZone} /> : '—'}
                    </td>
                    <td className="px-6 py-4 text-ink-muted">{formatDate(assessment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
