import { z } from 'zod';
import { USER_ROLES } from '@namo/types';

/** Self-service registration. Always creates a `PARENT` account. */
export const registerSchema = z.object({
  email: z.string().email().toLowerCase().max(160),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  fullName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email().toLowerCase().max(160),
  password: z.string().min(1).max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshInput = z.infer<typeof refreshSchema>;

/** Admin-only: create a user with an explicit role. */
export const adminCreateUserSchema = registerSchema.extend({
  role: z.enum(USER_ROLES),
});
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
