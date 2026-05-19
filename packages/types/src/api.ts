/**
 * The single response envelope used by every API endpoint
 * (master guide, section 8).
 */

export interface ApiError {
  /** Stable, machine-readable error code, e.g. `ASSESSMENT_NOT_FOUND`. */
  code: string;
  /** Human-readable, non-sensitive message. */
  message: string;
  /** Optional structured detail, e.g. field-level validation issues. */
  details?: unknown;
}

export interface ApiFailure {
  success: false;
  error: ApiError;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** A page of results returned by list endpoints. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
