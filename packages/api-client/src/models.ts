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
