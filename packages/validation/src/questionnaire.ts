import { z } from 'zod';

/** A single question within a domain. */
export const questionInputSchema = z.object({
  text: z.string().min(1).max(500),
  helpText: z.string().max(1000).optional(),
  order: z.number().int().min(0),
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

/** A scorable domain with its questions and zone thresholds. */
export const domainInputSchema = z
  .object({
    name: z.string().min(1).max(120),
    code: z
      .string()
      .min(1)
      .max(60)
      .regex(/^[a-z0-9_]+$/, 'Code must be lowercase alphanumeric with underscores'),
    order: z.number().int().min(0),
    /** Scores below this are DELAY. */
    delayThreshold: z.number().min(0),
    /** Scores at or above this are NORMAL; between the two is GREY_ZONE. */
    monitoringThreshold: z.number().min(0),
    questions: z.array(questionInputSchema).min(1, 'A domain needs at least one question'),
  })
  .refine((domain) => domain.delayThreshold <= domain.monitoringThreshold, {
    message: 'delayThreshold must be less than or equal to monitoringThreshold',
    path: ['delayThreshold'],
  });
export type DomainInput = z.infer<typeof domainInputSchema>;

/** Optional per-questionnaire override of response point weights. */
export const responseScoresSchema = z.object({
  YES: z.number(),
  SOMETIMES: z.number(),
  NOT_YET: z.number(),
});

/** Full create payload for a questionnaire version (admin). */
export const createQuestionnaireSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().max(2000).optional(),
    /** Inclusive child-age band, in months, this questionnaire applies to. */
    ageMinMonths: z.number().int().min(0).max(72),
    ageMaxMonths: z.number().int().min(0).max(72),
    responseScores: responseScoresSchema.optional(),
    domains: z.array(domainInputSchema).min(1, 'A questionnaire needs at least one domain'),
  })
  .refine((q) => q.ageMinMonths <= q.ageMaxMonths, {
    message: 'ageMinMonths must be less than or equal to ageMaxMonths',
    path: ['ageMinMonths'],
  });
export type CreateQuestionnaireInput = z.infer<typeof createQuestionnaireSchema>;

/** Metadata-only update; allowed while a questionnaire is still a DRAFT. */
export const updateQuestionnaireSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  description: z.string().max(2000).optional(),
  ageMinMonths: z.number().int().min(0).max(72).optional(),
  ageMaxMonths: z.number().int().min(0).max(72).optional(),
});
export type UpdateQuestionnaireInput = z.infer<typeof updateQuestionnaireSchema>;
