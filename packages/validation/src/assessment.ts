import { z } from 'zod';
import { RESPONSE_VALUES } from '@namo/types';

/** Start a new assessment of a child against a published questionnaire. */
export const startAssessmentSchema = z.object({
  childId: z.string().uuid(),
  questionnaireId: z.string().uuid(),
});
export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;

/** One answer: a question and the selected option. */
export const responseInputSchema = z.object({
  questionId: z.string().uuid(),
  value: z.enum(RESPONSE_VALUES),
});
export type ResponseInputDto = z.infer<typeof responseInputSchema>;

/**
 * Submit answers for an in-progress assessment. May be called repeatedly to
 * save progress; answers for the same question are upserted.
 */
export const submitResponsesSchema = z.object({
  responses: z.array(responseInputSchema).min(1, 'Provide at least one response'),
});
export type SubmitResponsesInput = z.infer<typeof submitResponsesSchema>;
