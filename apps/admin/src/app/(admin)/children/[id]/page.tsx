'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { ApiError } from '@namo/api-client';
import {
  Alert,
  Badge,
  Button,
  Field,
  KpiStrip,
  KpiTile,
  PageHeader,
  RiskBadge,
  SectionCard,
  Skeleton,
  StatusBadge,
  Textarea,
  ZoneBadge,
} from '@namo/ui';
import { api } from '@/lib/api';
import { formatDate, humanize } from '@/lib/format';

const REFERRAL_KIND_OPTIONS = [
  'PEDIATRICIAN',
  'SPEECH_THERAPY',
  'OCCUPATIONAL_THERAPY',
  'PHYSICAL_THERAPY',
  'PSYCHOLOGY',
  'OTHER',
] as const;
const PRIORITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function ChildProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: ['admin-child', id],
    queryFn: () => api().adminChildProfile(id),
  });

  const [noteBody, setNoteBody] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [referralOpen, setReferralOpen] = useState(false);
  const [refKind, setRefKind] = useState<(typeof REFERRAL_KIND_OPTIONS)[number]>('PEDIATRICIAN');
  const [refPriority, setRefPriority] = useState<(typeof PRIORITY_OPTIONS)[number]>('HIGH');
  const [refReason, setRefReason] = useState('');
  const [refError, setRefError] = useState<string | null>(null);

  const addNote = useMutation({
    mutationFn: () => api().adminAddChildNote(id, { body: noteBody, kind: 'ADMIN' }),
    onSuccess: async () => {
      setNoteBody('');
      setNoteError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-child', id] });
    },
    onError: (error) =>
      setNoteError(error instanceof ApiError ? error.message : 'Could not save note.'),
  });

  const createReferral = useMutation({
    mutationFn: () =>
      api().adminCreateReferral({
        childId: id,
        kind: refKind,
        priority: refPriority,
        reason: refReason,
      }),
    onSuccess: async () => {
      setReferralOpen(false);
      setRefReason('');
      setRefError(null);
      await queryClient.invalidateQueries({ queryKey: ['admin-child', id] });
    },
    onError: (error) =>
      setRefError(error instanceof ApiError ? error.message : 'Could not create referral.'),
  });

  if (profileQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Loading…" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Child not found" />
        <Alert variant="error">We couldn&apos;t load this child profile.</Alert>
      </div>
    );
  }

  const profile = profileQuery.data;
  const completed = profile.assessments.filter((a) => a.status === 'COMPLETED');
  const latest = completed[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${profile.firstName} ${profile.lastName ?? ''}`.trim()}
        description={`Age ${profile.ageMonths} months · DOB ${formatDate(profile.dateOfBirth)} · ${humanize(profile.gender)}`}
        actions={
          <Link href="/children" className="text-sm font-medium text-ink-muted hover:text-ink">
            ← All children
          </Link>
        }
      />

      <KpiStrip>
        <KpiTile
          label="Risk"
          value={<RiskBadge level={profile.riskLevel} />}
          hint={`Score ${profile.riskScore}`}
          tone={
            profile.riskLevel === 'CRITICAL'
              ? 'danger'
              : profile.riskLevel === 'HIGH'
                ? 'warning'
                : 'neutral'
          }
        />
        <KpiTile
          label="Assessments"
          value={profile.assessmentCount}
          hint={`${completed.length} completed`}
        />
        <KpiTile
          label="Latest outcome"
          value={latest?.overallZone ? <ZoneBadge zone={latest.overallZone} /> : '—'}
          hint={latest?.completedAt ? `Completed ${formatDate(latest.completedAt)}` : 'No completed assessments'}
        />
        <KpiTile
          label="Delay domains"
          value={profile.delayDomainCount}
          hint="In the latest completed check-in"
          tone={profile.delayDomainCount >= 2 ? 'danger' : profile.delayDomainCount === 1 ? 'warning' : 'neutral'}
        />
      </KpiStrip>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Parent">
          <div className="space-y-1 text-sm">
            <p className="font-medium text-ink">{profile.parent.fullName}</p>
            <p className="text-ink-muted">{profile.parent.email}</p>
            {profile.parent.phone && <p className="text-ink-muted">{profile.parent.phone}</p>}
          </div>
        </SectionCard>
        <SectionCard title="Medical">
          <div className="space-y-1 text-sm">
            <p className="text-ink-muted">
              Gestational age:{' '}
              <span className="text-ink">
                {profile.gestationalAgeWeeks ? `${profile.gestationalAgeWeeks} weeks` : '—'}
              </span>
            </p>
            <p className="text-ink-muted">
              Profile created: <span className="text-ink">{formatDate(profile.createdAt)}</span>
            </p>
          </div>
        </SectionCard>
        <SectionCard
          title="Quick actions"
          actions={
            <Button size="sm" onClick={() => setReferralOpen((open) => !open)}>
              {referralOpen ? 'Cancel' : 'New referral'}
            </Button>
          }
        >
          {referralOpen ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (refReason.trim().length < 3) {
                  setRefError('Reason is required (min 3 chars).');
                  return;
                }
                createReferral.mutate();
              }}
              className="space-y-3"
            >
              {refError && <Alert variant="error">{refError}</Alert>}
              <Field label="Specialist">
                <select
                  className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
                  value={refKind}
                  onChange={(event) => setRefKind(event.target.value as typeof refKind)}
                >
                  {REFERRAL_KIND_OPTIONS.map((kind) => (
                    <option key={kind} value={kind}>
                      {humanize(kind)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority">
                <select
                  className="w-full rounded-xl border border-sand-300 bg-surface px-3 py-2 text-sm"
                  value={refPriority}
                  onChange={(event) =>
                    setRefPriority(event.target.value as typeof refPriority)
                  }
                >
                  {PRIORITY_OPTIONS.map((value) => (
                    <option key={value} value={value}>
                      {humanize(value)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reason">
                <Textarea
                  rows={3}
                  value={refReason}
                  onChange={(event) => setRefReason(event.target.value)}
                  placeholder="e.g. Persistent delays in communication and fine motor"
                />
              </Field>
              <Button type="submit" loading={createReferral.isPending} fullWidth>
                Create referral
              </Button>
            </form>
          ) : (
            <p className="text-sm text-ink-muted">
              Open queues for this child can be tracked from the{' '}
              <Link href="/referrals" className="text-primary-600 hover:underline">
                Referrals queue
              </Link>
              .
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Development timeline"
        description={`${completed.length} completed · ${profile.assessmentCount - completed.length} in progress`}
      >
        {profile.assessments.length === 0 ? (
          <p className="text-sm text-ink-soft">No assessments started yet.</p>
        ) : (
          <ol className="space-y-3">
            {profile.assessments.map((assessment) => (
              <li
                key={assessment.id}
                className="rounded-2xl border border-sand-200 bg-sand-50/40 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {assessment.questionnaireTitle}
                    </p>
                    <p className="text-xs text-ink-soft">
                      Started {formatDate(assessment.createdAt)}
                      {assessment.completedAt && ` · Completed ${formatDate(assessment.completedAt)}`}
                      {' · '}
                      Age {assessment.childAgeMonths} mo
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {assessment.totalScore != null && assessment.totalMaxScore != null && (
                      <Badge tone="neutral">
                        {assessment.totalScore} / {assessment.totalMaxScore}
                      </Badge>
                    )}
                    {assessment.overallZone ? (
                      <ZoneBadge zone={assessment.overallZone} />
                    ) : (
                      <StatusBadge value={assessment.status} />
                    )}
                  </div>
                </div>
                {assessment.domainScores.length > 0 && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {assessment.domainScores.map((score) => (
                      <div
                        key={score.domainCode}
                        className="rounded-xl bg-surface px-3 py-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-ink">{score.domainName}</span>
                          <ZoneBadge zone={score.zone} />
                        </div>
                        <p className="mt-0.5 text-ink-soft">
                          {score.rawScore} / {score.maxScore}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Referrals">
          {profile.referrals.length === 0 ? (
            <p className="text-sm text-ink-soft">No referrals on file.</p>
          ) : (
            <ul className="space-y-2">
              {profile.referrals.map((referral) => (
                <li
                  key={referral.id}
                  className="flex items-center justify-between rounded-xl bg-sand-100/60 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{humanize(referral.kind)}</p>
                    <p className="text-xs text-ink-soft">
                      {humanize(referral.priority)} · {humanize(referral.status)} · {formatDate(referral.createdAt)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-muted">{referral.reason}</p>
                  </div>
                  <StatusBadge value={referral.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Admin notes" description="Visible to administrators and clinicians.">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (noteBody.trim().length < 1) {
                setNoteError('Add a note before saving.');
                return;
              }
              addNote.mutate();
            }}
            className="space-y-2"
          >
            {noteError && <Alert variant="error">{noteError}</Alert>}
            <Textarea
              rows={3}
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              placeholder="Add an internal note about this child…"
            />
            <Button type="submit" size="sm" loading={addNote.isPending}>
              Save note
            </Button>
          </form>
          {profile.notes.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">No notes yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {profile.notes.map((note) => (
                <li key={note.id} className="rounded-xl bg-sand-100/60 px-3 py-2 text-sm">
                  <p className="text-ink">{note.body}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    {note.authorName} · {formatDate(note.createdAt)} · {note.kind}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
