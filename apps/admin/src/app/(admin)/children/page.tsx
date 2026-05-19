'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Card, EmptyState, PageHeader, Skeleton } from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

export default function AdminChildrenPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-children'],
    queryFn: () => api().adminChildren({ pageSize: 100 }),
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Children" description="Every child profile across the platform." />

      {isLoading && <Skeleton className="h-64" />}
      {isError && <Alert variant="error">We couldn&apos;t load children.</Alert>}

      {data && data.items.length === 0 && (
        <EmptyState icon="🧒" title="No children yet" description="Children appear here once parents add them." />
      )}

      {data && data.items.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-sand-200 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Age</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Date of birth</th>
                  <th className="px-6 py-3 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((child) => (
                  <tr key={child.id} className="border-b border-sand-200 last:border-0">
                    <td className="px-6 py-4 font-medium text-ink">
                      {child.firstName} {child.lastName ?? ''}
                    </td>
                    <td className="px-6 py-4 text-ink-muted">{child.ageMonths} months</td>
                    <td className="px-6 py-4 text-ink-muted">{humanize(child.gender)}</td>
                    <td className="px-6 py-4 text-ink-muted">{formatDate(child.dateOfBirth)}</td>
                    <td className="px-6 py-4 text-ink-muted">{formatDate(child.createdAt)}</td>
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
