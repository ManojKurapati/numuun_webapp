import { z } from 'zod';

/** Schema for all environment variables the API depends on. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  /** Access-token lifetime, in seconds. */
  JWT_ACCESS_TTL: z.coerce.number().int().positive().default(900),
  /** Refresh-token lifetime, in days. */
  JWT_REFRESH_TTL_DAYS: z.coerce.number().int().positive().default(30),
  /** Comma-separated allowed browser origins. */
  CORS_ORIGINS: z.string().default(''),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

/** Validate raw env at boot. Throws with a readable message on failure. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = JSON.stringify(parsed.error.flatten().fieldErrors);
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  return parsed.data;
}
