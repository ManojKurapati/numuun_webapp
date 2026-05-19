import { z } from 'zod';
import { GENDERS } from '@namo/types';

/** Parent-entered child profile. */
export const createChildSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80).optional(),
  dateOfBirth: z.coerce
    .date()
    .refine((value) => value.getTime() <= Date.now(), 'Date of birth cannot be in the future'),
  gender: z.enum(GENDERS).default('UNDISCLOSED'),
  /** Gestational age at birth in weeks; used for prematurity-adjusted age. */
  gestationalAgeWeeks: z.number().int().min(20).max(45).optional(),
});
export type CreateChildInput = z.infer<typeof createChildSchema>;

/** All fields optional for partial updates. */
export const updateChildSchema = createChildSchema.partial();
export type UpdateChildInput = z.infer<typeof updateChildSchema>;
