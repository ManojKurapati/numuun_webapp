import { Child } from '@prisma/client';
import { Gender } from '@namo/types';
import { ageInMonths } from '../common/util/age.util';

/** A child profile as returned by the API. */
export interface PublicChild {
  id: string;
  parentId: string;
  firstName: string;
  lastName: string | null;
  /** ISO calendar date, `YYYY-MM-DD`. */
  dateOfBirth: string;
  gender: Gender;
  gestationalAgeWeeks: number | null;
  /** Current age in whole months, derived from date of birth. */
  ageMonths: number;
  createdAt: Date;
}

export function toPublicChild(child: Child): PublicChild {
  return {
    id: child.id,
    parentId: child.parentId,
    firstName: child.firstName,
    lastName: child.lastName,
    dateOfBirth: child.dateOfBirth.toISOString().slice(0, 10),
    gender: child.gender as Gender,
    gestationalAgeWeeks: child.gestationalAgeWeeks,
    ageMonths: ageInMonths(child.dateOfBirth),
    createdAt: child.createdAt,
  };
}
