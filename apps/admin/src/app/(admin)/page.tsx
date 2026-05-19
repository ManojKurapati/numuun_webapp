'use client';

import { useQuery } from '@tanstack/react-query';
import { Alert, Card, CardBody, CardHeader, CardTitle, PageHeader, Skeleton, StatCard } from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

function Breakdown({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <p className="text-sm text-ink-soft">No data yet.</p>;
  }
  return (
    <ul className="divide-y divide-sand-200">
      {entries.map(([key, value]) => (
        <li key={key} className="flex items-center justify-between py-2.5 text-sm">
          <span className="text-ink-muted">{humanize(key)}</span>
          <span className="font-semibold text-ink">{value}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api().adminStats(),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="A privacy-safe overview of activity across the platform."
      />

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      )}
      {isError && <Alert variant="error">We couldn&apos;t load the dashboard metrics.</Alert>}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Users" value={data.users.total} icon="👥" />
            <StatCard label="Children" value={data.children.total} icon="🧒" />
            <StatCard label="Questionnaires" value={data.questionnaires.total} icon="📋" />
            <StatCard label="Assessments" value={data.assessments.total} icon="📊" />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Users by role</CardTitle>
              </CardHeader>
              <CardBody>
                <Breakdown data={data.users.byRole} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Questionnaires by status</CardTitle>
              </CardHeader>
              <CardBody>
                <Breakdown data={data.questionnaires.byStatus} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Developmental zones</CardTitle>
              </CardHeader>
              <CardBody>
                <Breakdown data={data.assessments.zoneDistribution} />
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
