/**
 * Response shapes returned by the Namo API. These mirror the API's public
 * DTOs and form the documented client contract.
 */
import type { AssessmentStatus, Gender, QuestionnaireStatus, UserRole, Zone } from '@namo/types';

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

export interface Child {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string | null;
  dateOfBirth: string;
  gender: Gender;
  gestationalAgeWeeks: number | null;
  ageMonths: number;
  createdAt: string;
}

export interface QuestionView {
  id: string;
  text: string;
  helpText: string | null;
  order: number;
}

export interface DomainView {
  id: string;
  name: string;
  code: string;
  order: number;
  delayThreshold: number;
  monitoringThreshold: number;
  questions: QuestionView[];
}

export interface QuestionnaireSummary {
  id: string;
  title: string;
  description: string | null;
  version: number;
  status: QuestionnaireStatus;
  ageMinMonths: number;
  ageMaxMonths: number;
  domainCount: number;
  questionCount: number;
  publishedAt: string | null;
  createdAt: string;
}

export interface QuestionnaireDetail extends QuestionnaireSummary {
  domains: DomainView[];
}

export type ResponseValue = 'YES' | 'SOMETIMES' | 'NOT_YET';

export interface DomainScoreView {
  domainId: string;
  domainName: string;
  domainCode: string;
  rawScore: number;
  maxScore: number;
  zone: Zone;
}

export interface AssessmentSummary {
  id: string;
  childId: string;
  questionnaireId: string;
  status: AssessmentStatus;
  childAgeMonths: number;
  totalScore: number | null;
  totalMaxScore: number | null;
  overallZone: Zone | null;
  completedAt: string | null;
  createdAt: string;
}

export interface AssessmentDetail extends AssessmentSummary {
  responses: { questionId: string; value: ResponseValue }[];
  domainScores: DomainScoreView[];
  progress: { answered: number; total: number };
}

export interface PlatformOverview {
  users: { total: number; byRole: Record<string, number> };
  children: { total: number };
  questionnaires: { total: number; byStatus: Record<string, number> };
  assessments: {
    total: number;
    byStatus: Record<string, number>;
    zoneDistribution: Record<string, number>;
  };
}

export interface ExecutiveSnapshot extends PlatformOverview {
  assessmentsTrend: { date: string; count: number }[];
  domainDelays: { domainCode: string; domainName: string; delays: number; greys: number }[];
  ageBuckets: { label: string; count: number }[];
  queues: {
    pendingReviews: number;
    openReferrals: number;
    highRiskChildren: number;
    draftCampaigns: number;
  };
  activeParents30d: number;
  completionRate30d: number;
  referralFunnel: Record<string, number>;
}

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface AdminChildRow {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  dateOfBirth: string;
  ageMonths: number;
  parent: { id: string; fullName: string; email: string; phone: string | null };
  assessmentCount: number;
  lastAssessmentAt: string | null;
  latestZone: Zone | null;
  delayDomainCount: number;
  riskLevel: RiskLevel;
  riskScore: number;
}

export interface AdminChildProfile extends AdminChildRow {
  createdAt: string;
  gestationalAgeWeeks: number | null;
  assessments: {
    id: string;
    status: string;
    childAgeMonths: number;
    totalScore: number | null;
    totalMaxScore: number | null;
    overallZone: Zone | null;
    completedAt: string | null;
    createdAt: string;
    questionnaireId: string;
    questionnaireTitle: string;
    domainScores: {
      domainCode: string;
      domainName: string;
      rawScore: number;
      maxScore: number;
      zone: Zone;
    }[];
  }[];
  notes: {
    id: string;
    kind: string;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
  referrals: {
    id: string;
    kind: string;
    priority: string;
    status: string;
    reason: string;
    createdAt: string;
    scheduledAt: string | null;
    completedAt: string | null;
  }[];
}

export interface ReferralRow {
  id: string;
  child: { id: string; name: string; ageMonths: number };
  kind: string;
  priority: string;
  status: string;
  reason: string;
  notes: string | null;
  outcome: string | null;
  assignee: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string };
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InterventionRow {
  id: string;
  title: string;
  description: string;
  domainCodes: string[];
  ageMinMonths: number;
  ageMaxMonths: number;
  difficulty: string;
  durationMinutes: number;
  materials: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  effectiveness: number | null;
  views: number;
  completions: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UploadRow {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  status: string;
  confidence: number | null;
  questionnaireId: string | null;
  reviewNotes: string | null;
  reviewedBy: { id: string; fullName: string } | null;
  reviewedAt: string | null;
  createdBy: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  warningCount: number;
}

export interface UploadDetail extends UploadRow {
  extracted: unknown;
  warnings: unknown;
}

export interface CampaignRow {
  id: string;
  title: string;
  body: string;
  channel: string;
  audienceRoles: string[];
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdBy: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntryRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: { id: string; fullName: string; email: string; role: string } | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
}

export interface SystemHealth {
  services: { name: string; status: 'UP' | 'DEGRADED' | 'DOWN'; latencyMs: number | null }[];
  queues: { name: string; depth: number }[];
  aiMetrics: { name: string; value: number; unit: string }[];
}
