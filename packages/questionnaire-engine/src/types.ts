/**
 * Core types for the developmental questionnaire scoring engine.
 *
 * This package is intentionally generic and configurable: scoring weights and
 * zone thresholds are supplied per questionnaire version (see ADR-6). It does
 * not encode any proprietary instrument.
 */

/** A parent's answer to a single question. */
export type ResponseValue = 'YES' | 'SOMETIMES' | 'NOT_YET';

/** Developmental zone derived from a domain score. */
export type Zone = 'NORMAL' | 'GREY_ZONE' | 'DELAY';

/** All valid response values, in canonical order. */
export const RESPONSE_VALUES: readonly ResponseValue[] = ['YES', 'SOMETIMES', 'NOT_YET'];

/** All valid zones, in canonical order. */
export const ZONES: readonly Zone[] = ['NORMAL', 'GREY_ZONE', 'DELAY'];

/** Default per-response point weights (master guide, section 16). */
export const DEFAULT_RESPONSE_SCORES: Readonly<Record<ResponseValue, number>> = Object.freeze({
  YES: 10,
  SOMETIMES: 5,
  NOT_YET: 0,
});

/** Thresholds that map a raw domain score to a {@link Zone}. */
export interface DomainThresholds {
  /** Scores at or above this value are {@link Zone} `NORMAL`. */
  monitoring: number;
  /**
   * Scores below this value are `DELAY`. Scores in
   * `[delay, monitoring)` are `GREY_ZONE`.
   */
  delay: number;
}

/** A single scorable domain within a questionnaire. */
export interface DomainDefinition {
  id: string;
  /** Question ids that belong to this domain; defines the maximum score. */
  questionIds: string[];
  thresholds: DomainThresholds;
}

/** The complete, version-pinned scoring definition for a questionnaire. */
export interface ScoringDefinition {
  /** Questionnaire version this scoring belongs to. The engine is version-aware. */
  version: string;
  /** Optional per-response weight override, merged over {@link DEFAULT_RESPONSE_SCORES}. */
  responseScores?: Partial<Record<ResponseValue, number>>;
  domains: DomainDefinition[];
}

/** A single answer submitted for scoring. */
export interface ResponseInput {
  questionId: string;
  value: ResponseValue;
}

/** Computed score for one domain. */
export interface DomainScore {
  domainId: string;
  rawScore: number;
  maxScore: number;
  zone: Zone;
}

/** Full result of scoring an assessment. */
export interface AssessmentScore {
  version: string;
  domainScores: DomainScore[];
  totalScore: number;
  totalMaxScore: number;
  /** The most severe zone across all domains. */
  overallZone: Zone;
}
