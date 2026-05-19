import { QuestionnaireScoringError } from './errors';
import {
  AssessmentScore,
  DEFAULT_RESPONSE_SCORES,
  DomainScore,
  DomainThresholds,
  RESPONSE_VALUES,
  ResponseInput,
  ResponseValue,
  ScoringDefinition,
  Zone,
} from './types';

/** Ordinal severity used to derive the overall zone. Higher is worse. */
const ZONE_SEVERITY: Readonly<Record<Zone, number>> = Object.freeze({
  NORMAL: 0,
  GREY_ZONE: 1,
  DELAY: 2,
});

/** Map a raw domain score to a zone. Deterministic; no side effects. */
export function resolveZone(score: number, thresholds: DomainThresholds): Zone {
  if (score >= thresholds.monitoring) return 'NORMAL';
  if (score >= thresholds.delay) return 'GREY_ZONE';
  return 'DELAY';
}

/**
 * Score a completed assessment.
 *
 * The function is pure and deterministic — given the same definition and
 * responses it always returns the same result. All invalid input raises a
 * {@link QuestionnaireScoringError} with a stable code; nothing fails silently.
 */
export function scoreAssessment(
  definition: ScoringDefinition,
  responses: ResponseInput[],
): AssessmentScore {
  if (definition.domains.length === 0) {
    throw new QuestionnaireScoringError('NO_DOMAINS', 'Scoring definition has no domains.');
  }

  const weights: Record<ResponseValue, number> = {
    ...DEFAULT_RESPONSE_SCORES,
    ...definition.responseScores,
  };
  for (const value of RESPONSE_VALUES) {
    if (!Number.isFinite(weights[value])) {
      throw new QuestionnaireScoringError(
        'INVALID_WEIGHT',
        `Response weight for "${value}" is not a finite number.`,
      );
    }
  }
  const maxWeight = Math.max(...RESPONSE_VALUES.map((value) => weights[value]));

  // Index every question to its domain and reject structural problems early.
  const questionToDomain = new Map<string, string>();
  for (const domain of definition.domains) {
    if (domain.questionIds.length === 0) {
      throw new QuestionnaireScoringError(
        'EMPTY_DOMAIN',
        `Domain "${domain.id}" contains no questions.`,
      );
    }
    if (domain.thresholds.delay > domain.thresholds.monitoring) {
      throw new QuestionnaireScoringError(
        'INVALID_THRESHOLDS',
        `Domain "${domain.id}" has a delay threshold above its monitoring threshold.`,
      );
    }
    for (const questionId of domain.questionIds) {
      if (questionToDomain.has(questionId)) {
        throw new QuestionnaireScoringError(
          'DUPLICATE_QUESTION',
          `Question "${questionId}" appears in more than one domain.`,
        );
      }
      questionToDomain.set(questionId, domain.id);
    }
  }

  // Index responses and reject duplicate, invalid or unknown answers.
  const responseByQuestion = new Map<string, ResponseValue>();
  for (const response of responses) {
    if (!RESPONSE_VALUES.includes(response.value)) {
      throw new QuestionnaireScoringError(
        'INVALID_RESPONSE',
        `Invalid response value "${response.value}" for question "${response.questionId}".`,
      );
    }
    if (responseByQuestion.has(response.questionId)) {
      throw new QuestionnaireScoringError(
        'DUPLICATE_RESPONSE',
        `Question "${response.questionId}" was answered more than once.`,
      );
    }
    if (!questionToDomain.has(response.questionId)) {
      throw new QuestionnaireScoringError(
        'UNKNOWN_QUESTION',
        `Response refers to unknown question "${response.questionId}".`,
      );
    }
    responseByQuestion.set(response.questionId, response.value);
  }

  const domainScores: DomainScore[] = definition.domains.map((domain) => {
    let rawScore = 0;
    for (const questionId of domain.questionIds) {
      const value = responseByQuestion.get(questionId);
      if (value === undefined) {
        throw new QuestionnaireScoringError(
          'MISSING_RESPONSE',
          `Missing response for question "${questionId}".`,
        );
      }
      rawScore += weights[value];
    }
    const maxScore = domain.questionIds.length * maxWeight;
    return {
      domainId: domain.id,
      rawScore,
      maxScore,
      zone: resolveZone(rawScore, domain.thresholds),
    };
  });

  const totalScore = domainScores.reduce((sum, domain) => sum + domain.rawScore, 0);
  const totalMaxScore = domainScores.reduce((sum, domain) => sum + domain.maxScore, 0);
  const overallZone = domainScores.reduce<Zone>(
    (worst, domain) => (ZONE_SEVERITY[domain.zone] > ZONE_SEVERITY[worst] ? domain.zone : worst),
    'NORMAL',
  );

  return {
    version: definition.version,
    domainScores,
    totalScore,
    totalMaxScore,
    overallZone,
  };
}
