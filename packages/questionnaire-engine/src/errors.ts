/** Stable error codes raised by the scoring engine. */
export type ScoringErrorCode =
  | 'NO_DOMAINS'
  | 'EMPTY_DOMAIN'
  | 'INVALID_THRESHOLDS'
  | 'INVALID_WEIGHT'
  | 'DUPLICATE_QUESTION'
  | 'DUPLICATE_RESPONSE'
  | 'INVALID_RESPONSE'
  | 'UNKNOWN_QUESTION'
  | 'MISSING_RESPONSE';

/**
 * Raised for any invalid scoring input. Carries a stable {@link ScoringErrorCode}
 * so callers can map it to an API error without string matching.
 */
export class QuestionnaireScoringError extends Error {
  constructor(
    public readonly code: ScoringErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'QuestionnaireScoringError';
    Object.setPrototypeOf(this, QuestionnaireScoringError.prototype);
  }
}
