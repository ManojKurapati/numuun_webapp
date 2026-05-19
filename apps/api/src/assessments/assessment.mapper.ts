import { Prisma, Assessment } from '@prisma/client';
import { AssessmentStatus, ResponseValue, Zone } from '@namo/types';

/** An assessment loaded with the data needed to render its result. */
export type AssessmentWithResult = Prisma.AssessmentGetPayload<{
  include: {
    responses: true;
    domainScores: { include: { domain: true } };
  };
}>;

export interface ResponseView {
  questionId: string;
  value: ResponseValue;
}

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
  completedAt: Date | null;
  createdAt: Date;
}

export interface AssessmentDetail extends AssessmentSummary {
  responses: ResponseView[];
  domainScores: DomainScoreView[];
  /** How many of the questionnaire's questions have been answered. */
  progress: { answered: number; total: number };
}

export function toSummary(assessment: Assessment): AssessmentSummary {
  return {
    id: assessment.id,
    childId: assessment.childId,
    questionnaireId: assessment.questionnaireId,
    status: assessment.status as AssessmentStatus,
    childAgeMonths: assessment.childAgeMonths,
    totalScore: assessment.totalScore,
    totalMaxScore: assessment.totalMaxScore,
    overallZone: assessment.overallZone as Zone | null,
    completedAt: assessment.completedAt,
    createdAt: assessment.createdAt,
  };
}

export function toDetail(
  assessment: AssessmentWithResult,
  totalQuestions: number,
): AssessmentDetail {
  return {
    ...toSummary(assessment),
    responses: assessment.responses.map((response) => ({
      questionId: response.questionId,
      value: response.value as ResponseValue,
    })),
    domainScores: assessment.domainScores.map((score) => ({
      domainId: score.domainId,
      domainName: score.domain.name,
      domainCode: score.domain.code,
      rawScore: score.rawScore,
      maxScore: score.maxScore,
      zone: score.zone as Zone,
    })),
    progress: { answered: assessment.responses.length, total: totalQuestions },
  };
}
