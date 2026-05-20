-- Admin-domain models: referrals, interventions, questionnaire uploads,
-- campaigns and child notes. Adds supporting enums and indexes.

CREATE TYPE "ReferralPriority" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');
CREATE TYPE "ReferralStatus" AS ENUM ('OPEN', 'ACCEPTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ReferralKind" AS ENUM (
  'PEDIATRICIAN', 'SPEECH_THERAPY', 'OCCUPATIONAL_THERAPY',
  'PHYSICAL_THERAPY', 'PSYCHOLOGY', 'OTHER'
);
CREATE TYPE "InterventionDifficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');
CREATE TYPE "UploadStatus" AS ENUM (
  'UPLOADED', 'PROCESSING', 'EXTRACTED', 'NEEDS_REVIEW',
  'APPROVED', 'PUBLISHED', 'REJECTED'
);
CREATE TYPE "NotificationChannel" AS ENUM ('PUSH', 'SMS', 'EMAIL');
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENT', 'CANCELLED');

CREATE TABLE "referrals" (
  "id" UUID NOT NULL,
  "childId" UUID NOT NULL,
  "kind" "ReferralKind" NOT NULL,
  "priority" "ReferralPriority" NOT NULL DEFAULT 'MEDIUM',
  "status" "ReferralStatus" NOT NULL DEFAULT 'OPEN',
  "reason" TEXT NOT NULL,
  "notes" TEXT,
  "outcome" TEXT,
  "assigneeId" UUID,
  "createdById" UUID NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "referrals_childId_idx" ON "referrals"("childId");
CREATE INDEX "referrals_status_idx" ON "referrals"("status");
CREATE INDEX "referrals_priority_idx" ON "referrals"("priority");

ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_assigneeId_fkey"
  FOREIGN KEY ("assigneeId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "referrals"
  ADD CONSTRAINT "referrals_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "interventions" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "domainCodes" TEXT NOT NULL,
  "ageMinMonths" INTEGER NOT NULL,
  "ageMaxMonths" INTEGER NOT NULL,
  "difficulty" "InterventionDifficulty" NOT NULL DEFAULT 'EASY',
  "durationMinutes" INTEGER NOT NULL,
  "materials" TEXT,
  "videoUrl" TEXT,
  "thumbnailUrl" TEXT,
  "effectiveness" DOUBLE PRECISION,
  "views" INTEGER NOT NULL DEFAULT 0,
  "completions" INTEGER NOT NULL DEFAULT 0,
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "interventions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "interventions_isPublished_idx" ON "interventions"("isPublished");
CREATE INDEX "interventions_ageMinMonths_ageMaxMonths_idx" ON "interventions"("ageMinMonths", "ageMaxMonths");

ALTER TABLE "interventions"
  ADD CONSTRAINT "interventions_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "questionnaire_uploads" (
  "id" UUID NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "storageKey" TEXT NOT NULL,
  "status" "UploadStatus" NOT NULL DEFAULT 'UPLOADED',
  "confidence" DOUBLE PRECISION,
  "extracted" JSONB,
  "warnings" JSONB,
  "questionnaireId" UUID,
  "reviewNotes" TEXT,
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMP(3),
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "questionnaire_uploads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "questionnaire_uploads_status_idx" ON "questionnaire_uploads"("status");

ALTER TABLE "questionnaire_uploads"
  ADD CONSTRAINT "questionnaire_uploads_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "questionnaire_uploads"
  ADD CONSTRAINT "questionnaire_uploads_reviewedById_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "campaigns" (
  "id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "channel" "NotificationChannel" NOT NULL DEFAULT 'PUSH',
  "audienceRoles" TEXT NOT NULL DEFAULT 'PARENT',
  "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
  "scheduledFor" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "recipientCount" INTEGER NOT NULL DEFAULT 0,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

ALTER TABLE "campaigns"
  ADD CONSTRAINT "campaigns_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "child_notes" (
  "id" UUID NOT NULL,
  "childId" UUID NOT NULL,
  "body" TEXT NOT NULL,
  "kind" TEXT NOT NULL DEFAULT 'ADMIN',
  "authorId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "child_notes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "child_notes_childId_idx" ON "child_notes"("childId");

ALTER TABLE "child_notes"
  ADD CONSTRAINT "child_notes_childId_fkey"
  FOREIGN KEY ("childId") REFERENCES "children"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "child_notes"
  ADD CONSTRAINT "child_notes_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
