'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Alert, Badge, Button, Card, EmptyState, PageHeader, Skeleton } from '@namo/ui';
import type { BadgeTone } from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: 'neutral',
  PUBLISHED: 'teal',
  ARCHIVED: 'clay',
};

export default function QuestionnairesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['questionnaires'],
    queryFn: () => api().listQuestionnaires({ pageSize: 100 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Questionnaires"
        description="Author and publish developmental check-ins."
        actions={
          <Link href="/questionnaires/new">
            <Button>New questionnaire</Button>
          </Link>
        }
      />

      {isLoading && <Skeleton className="h-64" />}
      {isError && <Alert variant="error">We couldn&apos;t load questionnaires.</Alert>}

      {data && data.items.length === 0 && (
        <EmptyState
          icon="📋"
          title="No questionnaires yet"
          description="Create your first developmental check-in."
          action={
            <Link href="/questionnaires/new">
              <Button>New questionnaire</Button>
            </Link>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium">Age band</th>
                  <th className="px-6 py-3 font-medium">Structure</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((questionnaire) => (
                  <tr
                    key={questionnaire.id}
                    className="border-b border-sand-200 last:border-0 hover:bg-sand-50"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`/questionnaires/${questionnaire.id}`}
                        className="font-medium text-ink hover:text-primary-600"
                      >
                        {questionnaire.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-ink-muted">
                      {questionnaire.ageMinMonths}–{questionnaire.ageMaxMonths} mo
                    </td>
                    <td className="px-6 py-4 text-ink-muted">
                      {questionnaire.domainCount} areas · {questionnaire.questionCount} questions
                    </td>
                    <td className="px-6 py-4">
                      <Badge tone={STATUS_TONE[questionnaire.status] ?? 'neutral'}>
                        {humanize(questionnaire.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-ink-muted">
                      {formatDate(questionnaire.createdAt)}
                    </td>
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
