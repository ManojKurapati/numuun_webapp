'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  PageHeader,
  SectionCard,
  Select,
  Skeleton,
} from '@namo/ui';
import { api } from '@/lib/api';
import { humanize } from '@/lib/format';

type ReportKind = 'OVERVIEW' | 'CHILDREN' | 'ASSESSMENTS' | 'REFERRALS' | 'INTERVENTIONS';

const REPORT_OPTIONS: { value: ReportKind; label: string; description: string }[] = [
  {
    value: 'OVERVIEW',
    label: 'Platform overview',
    description: 'Headline KPIs, queues, zone distribution, domain delay tally.',
  },
  {
    value: 'CHILDREN',
    label: 'Children roster',
    description: 'Every child profile with parent, age, risk and latest zone.',
  },
  {
    value: 'ASSESSMENTS',
    label: 'Assessment outcomes',
    description: 'All completed assessments — score, zone, completion date.',
  },
  {
    value: 'REFERRALS',
    label: 'Referral pipeline',
    description: 'Open and closed referrals with priority, status, and outcome.',
  },
  {
    value: 'INTERVENTIONS',
    label: 'Intervention library',
    description: 'Published activities, age band, difficulty and effectiveness signal.',
  },
];

export default function ReportsPage() {
  const [report, setReport] = useState<ReportKind>('OVERVIEW');

  const overviewQuery = useQuery({
    queryKey: ['report-overview'],
    queryFn: () => api().adminExecutive(),
    enabled: report === 'OVERVIEW',
  });
  const childrenQuery = useQuery({
    queryKey: ['report-children'],
    queryFn: () => api().adminSearchChildren({ pageSize: 100 }),
    enabled: report === 'CHILDREN',
  });
  const assessmentsQuery = useQuery({
    queryKey: ['report-assessments'],
    queryFn: () => api().adminAssessments({ pageSize: 100 }),
    enabled: report === 'ASSESSMENTS',
  });
  const referralsQuery = useQuery({
    queryKey: ['report-referrals'],
    queryFn: () => api().adminReferrals({ pageSize: 200 }),
    enabled: report === 'REFERRALS',
  });
  const interventionsQuery = useQuery({
    queryKey: ['report-interventions'],
    queryFn: () => api().adminInterventions({ pageSize: 200 }),
    enabled: report === 'INTERVENTIONS',
  });

  const { rows, columns } = useMemo<{
    rows: Record<string, unknown>[];
    columns: string[];
  }>(() => {
    if (report === 'OVERVIEW' && overviewQuery.data) {
      const data = overviewQuery.data;
      const flat: Record<string, unknown>[] = [];
      flat.push({ metric: 'Total users', value: data.users.total });
      flat.push({ metric: 'Total children', value: data.children.total });
      flat.push({ metric: 'Total assessments', value: data.assessments.total });
      flat.push({ metric: 'Active parents (30d)', value: data.activeParents30d });
      flat.push({
        metric: 'Completion rate (30d)',
        value: `${(data.completionRate30d * 100).toFixed(1)}%`,
      });
      for (const [zone, count] of Object.entries(data.assessments.zoneDistribution)) {
        flat.push({ metric: `Zone ${zone}`, value: count });
      }
      for (const domain of data.domainDelays) {
        flat.push({ metric: `${domain.domainCode} delays (90d)`, value: domain.delays });
      }
      return { rows: flat, columns: ['metric', 'value'] };
    }
    if (report === 'CHILDREN' && childrenQuery.data) {
      return {
        rows: childrenQuery.data.items.map((child) => ({
          name: `${child.firstName} ${child.lastName ?? ''}`.trim(),
          age_months: child.ageMonths,
          gender: child.gender,
          parent_name: child.parent.fullName,
          parent_phone: child.parent.phone ?? '',
          risk: child.riskLevel,
          latest_zone: child.latestZone ?? '',
          assessments: child.assessmentCount,
          last_assessment: child.lastAssessmentAt ?? '',
        })),
        columns: [
          'name',
          'age_months',
          'gender',
          'parent_name',
          'parent_phone',
          'risk',
          'latest_zone',
          'assessments',
          'last_assessment',
        ],
      };
    }
    if (report === 'ASSESSMENTS' && assessmentsQuery.data) {
      return {
        rows: assessmentsQuery.data.items.map((assessment) => ({
          id: assessment.id,
          status: assessment.status,
          child_age_months: assessment.childAgeMonths,
          total_score: assessment.totalScore ?? '',
          total_max_score: assessment.totalMaxScore ?? '',
          overall_zone: assessment.overallZone ?? '',
          completed_at: assessment.completedAt ?? '',
          created_at: assessment.createdAt,
        })),
        columns: [
          'id',
          'status',
          'child_age_months',
          'total_score',
          'total_max_score',
          'overall_zone',
          'completed_at',
          'created_at',
        ],
      };
    }
    if (report === 'REFERRALS' && referralsQuery.data) {
      return {
        rows: referralsQuery.data.items.map((referral) => ({
          child: referral.child.name,
          age_months: referral.child.ageMonths,
          kind: referral.kind,
          priority: referral.priority,
          status: referral.status,
          reason: referral.reason,
          opened: referral.createdAt,
          scheduled: referral.scheduledAt ?? '',
          completed: referral.completedAt ?? '',
        })),
        columns: [
          'child',
          'age_months',
          'kind',
          'priority',
          'status',
          'reason',
          'opened',
          'scheduled',
          'completed',
        ],
      };
    }
    if (report === 'INTERVENTIONS' && interventionsQuery.data) {
      return {
        rows: interventionsQuery.data.items.map((intervention) => ({
          title: intervention.title,
          domains: intervention.domainCodes.join(';'),
          age_min: intervention.ageMinMonths,
          age_max: intervention.ageMaxMonths,
          difficulty: intervention.difficulty,
          duration_min: intervention.durationMinutes,
          is_published: intervention.isPublished,
          effectiveness:
            intervention.effectiveness != null
              ? `${(intervention.effectiveness * 100).toFixed(0)}%`
              : '',
        })),
        columns: [
          'title',
          'domains',
          'age_min',
          'age_max',
          'difficulty',
          'duration_min',
          'is_published',
          'effectiveness',
        ],
      };
    }
    return { rows: [], columns: [] };
  }, [
    report,
    overviewQuery.data,
    childrenQuery.data,
    assessmentsQuery.data,
    referralsQuery.data,
    interventionsQuery.data,
  ]);

  const loading =
    (report === 'OVERVIEW' && overviewQuery.isLoading) ||
    (report === 'CHILDREN' && childrenQuery.isLoading) ||
    (report === 'ASSESSMENTS' && assessmentsQuery.isLoading) ||
    (report === 'REFERRALS' && referralsQuery.isLoading) ||
    (report === 'INTERVENTIONS' && interventionsQuery.isLoading);
  const error =
    overviewQuery.error ||
    childrenQuery.error ||
    assessmentsQuery.error ||
    referralsQuery.error ||
    interventionsQuery.error;

  const downloadCsv = () => {
    if (rows.length === 0) return;
    const escape = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };
    const lines = [
      columns.join(','),
      ...rows.map((row) => columns.map((key) => escape(row[key])).join(',')),
    ];
    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.toLowerCase()}-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.toLowerCase()}-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        description="Exportable, privacy-safe reports for governments, hospitals and partners."
      />

      <Card>
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <Select value={report} onChange={(event) => setReport(event.target.value as ReportKind)}>
                {REPORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <p className="mt-2 text-xs text-ink-soft">
                {REPORT_OPTIONS.find((option) => option.value === report)?.description}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={downloadJson} disabled={rows.length === 0}>
                Download JSON
              </Button>
              <Button onClick={downloadCsv} disabled={rows.length === 0}>
                Download CSV
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {error && <Alert variant="error">We couldn&apos;t load the report data.</Alert>}

      <SectionCard
        title={REPORT_OPTIONS.find((option) => option.value === report)?.label}
        description={`${rows.length} row${rows.length === 1 ? '' : 's'}`}
        actions={<Badge tone="primary">{report}</Badge>}
      >
        {loading ? (
          <Skeleton className="h-48" />
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No rows for this report yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-sand-100/60">
                <tr className="text-left uppercase tracking-wide text-ink-soft">
                  {columns.map((col) => (
                    <th key={col} className="px-3 py-2 font-medium">
                      {humanize(col)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 50).map((row, index) => (
                  <tr key={index} className="border-t border-sand-200">
                    {columns.map((col) => (
                      <td key={col} className="px-3 py-1.5 text-ink">
                        {row[col] === '' || row[col] === null || row[col] === undefined
                          ? '—'
                          : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 50 && (
              <p className="mt-2 text-xs text-ink-soft">
                Showing first 50 rows. Download for the full dataset.
              </p>
            )}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
