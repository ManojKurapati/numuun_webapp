import { Prisma } from '@prisma/client';
import { ResponseValue, ScoringDefinition } from '@namo/questionnaire-engine';
import { QuestionnaireStatus } from '@namo/types';

/** A questionnaire loaded with its full domain/question graph. */
export type QuestionnaireWithGraph = Prisma.QuestionnaireGetPayload<{
  include: { domains: { include: { questions: true } } };
}>;

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
  publishedAt: Date | null;
  createdAt: Date;
}

export interface QuestionnaireDetail extends QuestionnaireSummary {
  domains: DomainView[];
}

/** Domains and questions sorted by their declared display order. */
function orderedDomains(questionnaire: QuestionnaireWithGraph): QuestionnaireWithGraph['domains'] {
  return [...questionnaire.domains]
    .sort((a, b) => a.order - b.order)
    .map((domain) => ({
      ...domain,
      questions: [...domain.questions].sort((a, b) => a.order - b.order),
    }));
}

export function toSummary(questionnaire: QuestionnaireWithGraph): QuestionnaireSummary {
  const questionCount = questionnaire.domains.reduce((sum, d) => sum + d.questions.length, 0);
  return {
    id: questionnaire.id,
    title: questionnaire.title,
    description: questionnaire.description,
    version: questionnaire.version,
    status: questionnaire.status as QuestionnaireStatus,
    ageMinMonths: questionnaire.ageMinMonths,
    ageMaxMonths: questionnaire.ageMaxMonths,
    domainCount: questionnaire.domains.length,
    questionCount,
    publishedAt: questionnaire.publishedAt,
    createdAt: questionnaire.createdAt,
  };
}

export function toDetail(questionnaire: QuestionnaireWithGraph): QuestionnaireDetail {
  return {
    ...toSummary(questionnaire),
    domains: orderedDomains(questionnaire).map((domain) => ({
      id: domain.id,
      name: domain.name,
      code: domain.code,
      order: domain.order,
      delayThreshold: domain.delayThreshold,
      monitoringThreshold: domain.monitoringThreshold,
      questions: domain.questions.map((question) => ({
        id: question.id,
        text: question.text,
        helpText: question.helpText,
        order: question.order,
      })),
    })),
  };
}

/**
 * Build the version-pinned {@link ScoringDefinition} consumed by the
 * questionnaire-engine. Response weights are included only when the
 * questionnaire fully overrides them.
 */
export function toScoringDefinition(questionnaire: QuestionnaireWithGraph): ScoringDefinition {
  const { yesScore, sometimesScore, notYetScore } = questionnaire;
  const hasOverride = yesScore !== null && sometimesScore !== null && notYetScore !== null;
  const responseScores: Record<ResponseValue, number> | undefined = hasOverride
    ? { YES: yesScore, SOMETIMES: sometimesScore, NOT_YET: notYetScore }
    : undefined;

  return {
    version: String(questionnaire.version),
    responseScores,
    domains: orderedDomains(questionnaire).map((domain) => ({
      id: domain.id,
      questionIds: domain.questions.map((question) => question.id),
      thresholds: { delay: domain.delayThreshold, monitoring: domain.monitoringThreshold },
    })),
  };
}
