/** Platform roles. Drives RBAC across every service. */
export const USER_ROLES = ['PARENT', 'PEDIATRICIAN', 'ADMIN', 'GOV_PROGRAM', 'HOSPITAL'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Child gender options. `UNDISCLOSED` is the default when not provided. */
export const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'UNDISCLOSED'] as const;
export type Gender = (typeof GENDERS)[number];

/** Lifecycle states for a questionnaire version (draft/publish workflow). */
export const QUESTIONNAIRE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type QuestionnaireStatus = (typeof QUESTIONNAIRE_STATUSES)[number];

/** Lifecycle states for a parent's assessment of a child. */
export const ASSESSMENT_STATUSES = ['IN_PROGRESS', 'COMPLETED'] as const;
export type AssessmentStatus = (typeof ASSESSMENT_STATUSES)[number];

/** A parent's answer to a question. Mirrors the scoring engine's `ResponseValue`. */
export const RESPONSE_VALUES = ['YES', 'SOMETIMES', 'NOT_YET'] as const;
export type ResponseValue = (typeof RESPONSE_VALUES)[number];

/** Developmental zone derived from a domain score. Mirrors the engine's `Zone`. */
export const ZONES = ['NORMAL', 'GREY_ZONE', 'DELAY'] as const;
export type Zone = (typeof ZONES)[number];
