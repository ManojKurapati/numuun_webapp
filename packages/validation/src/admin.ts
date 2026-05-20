import { z } from 'zod';

// --- Children / risk ---------------------------------------------------------

export const childSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  riskLevel: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE']).optional(),
  ageMinMonths: z.coerce.number().int().min(0).max(120).optional(),
  ageMaxMonths: z.coerce.number().int().min(0).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ChildSearchInput = z.infer<typeof childSearchSchema>;

// --- Referrals ---------------------------------------------------------------

export const REFERRAL_KINDS = [
  'PEDIATRICIAN',
  'SPEECH_THERAPY',
  'OCCUPATIONAL_THERAPY',
  'PHYSICAL_THERAPY',
  'PSYCHOLOGY',
  'OTHER',
] as const;
export const REFERRAL_PRIORITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
export const REFERRAL_STATUSES = [
  'OPEN',
  'ACCEPTED',
  'SCHEDULED',
  'COMPLETED',
  'CANCELLED',
] as const;

export const createReferralSchema = z.object({
  childId: z.string().uuid(),
  kind: z.enum(REFERRAL_KINDS),
  priority: z.enum(REFERRAL_PRIORITIES).default('MEDIUM'),
  reason: z.string().trim().min(3).max(2000),
  notes: z.string().trim().max(4000).optional(),
});
export type CreateReferralInput = z.infer<typeof createReferralSchema>;

export const updateReferralSchema = z.object({
  status: z.enum(REFERRAL_STATUSES).optional(),
  priority: z.enum(REFERRAL_PRIORITIES).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(4000).optional(),
  outcome: z.string().trim().max(4000).optional(),
  scheduledAt: z.coerce.date().optional(),
});
export type UpdateReferralInput = z.infer<typeof updateReferralSchema>;

// --- Interventions -----------------------------------------------------------

export const INTERVENTION_DIFFICULTIES = ['EASY', 'MODERATE', 'CHALLENGING'] as const;

export const createInterventionSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(4000),
  domainCodes: z.array(z.string().trim().min(1).max(8)).min(1),
  ageMinMonths: z.coerce.number().int().min(0).max(120),
  ageMaxMonths: z.coerce.number().int().min(0).max(120),
  difficulty: z.enum(INTERVENTION_DIFFICULTIES).default('EASY'),
  durationMinutes: z.coerce.number().int().min(1).max(180),
  materials: z.string().trim().max(2000).optional(),
  videoUrl: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
});
export type CreateInterventionInput = z.infer<typeof createInterventionSchema>;

export const updateInterventionSchema = createInterventionSchema
  .partial()
  .extend({ isPublished: z.boolean().optional() });
export type UpdateInterventionInput = z.infer<typeof updateInterventionSchema>;

// --- Questionnaire uploads (AI extraction review) ----------------------------

export const UPLOAD_STATUSES = [
  'UPLOADED',
  'PROCESSING',
  'EXTRACTED',
  'NEEDS_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
] as const;

export const createUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().min(1).max(120),
  sizeBytes: z.coerce.number().int().min(1).max(50 * 1024 * 1024),
  storageKey: z.string().trim().min(1).max(512),
});
export type CreateUploadInput = z.infer<typeof createUploadSchema>;

export const reviewUploadSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'NEEDS_REVIEW']),
  reviewNotes: z.string().trim().max(4000).optional(),
});
export type ReviewUploadInput = z.infer<typeof reviewUploadSchema>;

// --- Notifications / campaigns ----------------------------------------------

export const NOTIFICATION_CHANNELS = ['PUSH', 'SMS', 'EMAIL'] as const;
export const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED'] as const;

export const createCampaignSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().min(3).max(2000),
  channel: z.enum(NOTIFICATION_CHANNELS).default('PUSH'),
  audienceRoles: z.array(z.string().trim().min(1).max(40)).min(1),
  scheduledFor: z.coerce.date().optional(),
});
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = createCampaignSchema
  .partial()
  .extend({ status: z.enum(CAMPAIGN_STATUSES).optional() });
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

// --- Child notes -------------------------------------------------------------

export const createChildNoteSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  kind: z.string().trim().min(1).max(40).default('ADMIN'),
});
export type CreateChildNoteInput = z.infer<typeof createChildNoteSchema>;

// --- Audit log filter --------------------------------------------------------

export const auditQuerySchema = z.object({
  actorId: z.string().uuid().optional(),
  entityType: z.string().trim().min(1).max(80).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});
export type AuditQueryInput = z.infer<typeof auditQuerySchema>;
