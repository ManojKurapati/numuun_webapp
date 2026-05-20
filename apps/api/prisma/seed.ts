/**
 * Idempotent development seed.
 *
 * Seeds:
 *  - an admin account and a sample parent account;
 *  - the full ASQ-3 (Ages & Stages Questionnaires, Third Edition) content set —
 *    all 21 age-specific questionnaires transcribed from the scanned PDFs in
 *    `/questionaires`, published so the parent webapp matches one to a child by
 *    age automatically.
 *
 * Each ASQ-3 questionnaire has 5 scored domains x 6 questions = 30 scored items.
 * The non-scored OVERALL (yes/no concern) questions live in the source JSON for
 * reference but are NOT seeded as Domain/Question rows — every Domain row feeds
 * the scoring engine and the OVERALL items are not scored.
 *
 * Run with: `pnpm db:seed` (wired via the `prisma.seed` field in package.json).
 *
 * IMPORTANT — clinical cutoffs: the source PDFs do not contain the proprietary
 * ASQ-3 cutoff scores. The thresholds below are NON-CLINICAL placeholders so the
 * scoring engine has valid numbers; they MUST be replaced with the official
 * age/domain-specific ASQ-3 cutoffs before any clinical use.
 */
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import asq3 from './data/asq3-questionnaires.json';

const prisma = new PrismaClient();

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'ChangeMe123!';

/**
 * PLACEHOLDER thresholds. Domain max score = 6 questions x 10 (YES) = 60.
 * Replace with official ASQ-3 cutoffs per age band and domain before clinical use.
 */
const PLACEHOLDER_DELAY_THRESHOLD = 25;
const PLACEHOLDER_MONITORING_THRESHOLD = 40;

/** Title of the pre-ASQ-3 placeholder questionnaire, retired by this seed. */
const LEGACY_SAMPLE_TITLE = 'Early Development Check (2–12 months)';

interface SeedQuestion {
  order: number;
  text: string;
  helpText: string | null;
}
interface SeedDomain {
  name: string;
  code: string;
  order: number;
  notes: string | null;
  questions: SeedQuestion[];
}
interface SeedQuestionnaire {
  ageMonths: number;
  title: string;
  ageRangeText: string;
  ageMinMonths: number;
  ageMaxMonths: number;
  domains: SeedDomain[];
}

/** Create the admin and sample parent accounts; returns the admin. */
async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@namo.local' },
    update: {},
    create: {
      email: 'admin@namo.local',
      passwordHash,
      fullName: 'Namo Administrator',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'parent@namo.local' },
    update: {},
    create: {
      email: 'parent@namo.local',
      passwordHash,
      fullName: 'Sample Parent',
      role: 'PARENT',
    },
  });

  return admin;
}

/** Seed every ASQ-3 questionnaire as a PUBLISHED questionnaire with its graph. */
async function seedAsq3Questionnaires(adminId: string): Promise<void> {
  const questionnaires = asq3.questionnaires as SeedQuestionnaire[];
  let created = 0;
  let skipped = 0;

  for (const questionnaire of questionnaires) {
    const existing = await prisma.questionnaire.findFirst({
      where: { title: questionnaire.title, deletedAt: null },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.questionnaire.create({
      data: {
        title: questionnaire.title,
        description: `${asq3.instrument} — ${questionnaire.title} (${questionnaire.ageRangeText}).`,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        ageMinMonths: questionnaire.ageMinMonths,
        ageMaxMonths: questionnaire.ageMaxMonths,
        createdById: adminId,
        domains: {
          create: questionnaire.domains.map((domain) => ({
            name: domain.name,
            code: domain.code,
            order: domain.order,
            delayThreshold: PLACEHOLDER_DELAY_THRESHOLD,
            monitoringThreshold: PLACEHOLDER_MONITORING_THRESHOLD,
            questions: {
              create: domain.questions.map((question) => ({
                text: question.text,
                helpText: question.helpText ?? null,
                order: question.order,
              })),
            },
          })),
        },
      },
    });
    created += 1;
  }

  console.log(
    `Seeded ASQ-3 content: ${created} questionnaire(s) created, ${skipped} already present (${questionnaires.length} total).`,
  );
}

/**
 * Retire the pre-ASQ-3 placeholder questionnaire: archiving it keeps assessment
 * history intact while removing it from the parent age-matching results.
 */
async function archiveLegacySample(): Promise<void> {
  const { count } = await prisma.questionnaire.updateMany({
    where: { title: LEGACY_SAMPLE_TITLE, status: 'PUBLISHED', deletedAt: null },
    data: { status: 'ARCHIVED' },
  });
  if (count > 0) {
    console.log(`Archived ${count} legacy placeholder questionnaire(s).`);
  }
}

/**
 * Demo data for the admin-domain models so the new admin portal screens have
 * something meaningful to render against a fresh database. Idempotent: skips
 * if any rows of each kind already exist.
 */
async function seedAdminDomain(adminId: string): Promise<void> {
  const interventionsCount = await prisma.intervention.count();
  if (interventionsCount === 0) {
    await prisma.intervention.createMany({
      data: [
        {
          title: 'Tummy time songs',
          description:
            'Lay your baby on their tummy and sing while making eye contact. Builds neck and shoulder strength.',
          domainCodes: 'GM',
          ageMinMonths: 0,
          ageMaxMonths: 6,
          difficulty: 'EASY',
          durationMinutes: 5,
          materials: 'Soft blanket',
          effectiveness: 0.78,
          isPublished: true,
          createdById: adminId,
        },
        {
          title: 'Stacking soft blocks',
          description:
            'Encourage your toddler to stack 2–3 soft blocks. Develops pincer grip and hand-eye coordination.',
          domainCodes: 'FM',
          ageMinMonths: 9,
          ageMaxMonths: 18,
          difficulty: 'EASY',
          durationMinutes: 10,
          materials: 'Soft fabric blocks',
          effectiveness: 0.82,
          isPublished: true,
          createdById: adminId,
        },
        {
          title: 'Picture-book back-and-forth',
          description:
            'Point to pictures and pause for your child to point or babble back. Builds turn-taking and expressive language.',
          domainCodes: 'COM,PSL',
          ageMinMonths: 6,
          ageMaxMonths: 24,
          difficulty: 'EASY',
          durationMinutes: 15,
          materials: 'Picture book',
          effectiveness: 0.91,
          isPublished: true,
          createdById: adminId,
        },
        {
          title: 'Posting shapes through holes',
          description:
            'A shape-sorter activity to encourage problem solving and bimanual coordination.',
          domainCodes: 'PS,FM',
          ageMinMonths: 12,
          ageMaxMonths: 24,
          difficulty: 'MODERATE',
          durationMinutes: 15,
          materials: 'Shape-sorter toy',
          effectiveness: 0.74,
          isPublished: true,
          createdById: adminId,
        },
        {
          title: 'Obstacle-course adventure',
          description: 'Cushions, low tunnels, and stepping mats build gross motor planning.',
          domainCodes: 'GM,PS',
          ageMinMonths: 24,
          ageMaxMonths: 48,
          difficulty: 'CHALLENGING',
          durationMinutes: 20,
          materials: 'Cushions, blankets, tape',
          effectiveness: 0.69,
          isPublished: false,
          createdById: adminId,
        },
      ],
    });
    console.log('Seeded interventions.');
  }

  const campaignCount = await prisma.campaign.count();
  if (campaignCount === 0) {
    await prisma.campaign.createMany({
      data: [
        {
          title: 'Welcome from Namo',
          body: 'We help you track your child’s development with gentle, daily check-ins.',
          channel: 'PUSH',
          audienceRoles: 'PARENT',
          status: 'DRAFT',
          createdById: adminId,
        },
        {
          title: 'Monthly check-in reminder',
          body: 'Your child’s next ASQ check-in is now available. Takes ~10 minutes.',
          channel: 'PUSH',
          audienceRoles: 'PARENT',
          status: 'SCHEDULED',
          scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          createdById: adminId,
        },
      ],
    });
    console.log('Seeded campaigns.');
  }

  const uploadCount = await prisma.questionnaireUpload.count();
  if (uploadCount === 0) {
    await prisma.questionnaireUpload.createMany({
      data: [
        {
          fileName: 'asq-3-18-months.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 612_000,
          storageKey: 'seed/asq-3-18-months.pdf',
          status: 'NEEDS_REVIEW',
          confidence: 0.87,
          extracted: {
            title: 'Extracted draft — 18 months',
            description: 'Auto-drafted from upload. Review before publishing.',
            ageMinMonths: 17,
            ageMaxMonths: 19,
            domains: [
              { name: 'Communication', code: 'COM', questions: 6 },
              { name: 'Gross Motor', code: 'GM', questions: 6 },
              { name: 'Fine Motor', code: 'FM', questions: 6 },
              { name: 'Problem Solving', code: 'PS', questions: 6 },
              { name: 'Personal-Social', code: 'PSL', questions: 6 },
            ],
          },
          warnings: [
            { field: 'thresholds', message: 'Clinical cutoff scores must be set by an administrator.' },
            { field: 'page-3', message: 'OCR confidence below threshold on page 3 — check questions 4–6.' },
          ],
          createdById: adminId,
        },
        {
          fileName: 'mchat-revised.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 320_000,
          storageKey: 'seed/mchat-revised.pdf',
          status: 'UPLOADED',
          createdById: adminId,
        },
      ],
    });
    console.log('Seeded questionnaire uploads.');
  }

  // Referrals can only seed if at least one child exists. Skip otherwise — they
  // are surfaced naturally when an admin creates one from a child profile.
  const referralCount = await prisma.referral.count();
  const firstChild = await prisma.child.findFirst({ where: { deletedAt: null } });
  if (referralCount === 0 && firstChild) {
    await prisma.referral.createMany({
      data: [
        {
          childId: firstChild.id,
          kind: 'SPEECH_THERAPY',
          priority: 'HIGH',
          status: 'OPEN',
          reason: 'Multiple delays in expressive communication across two assessments.',
          createdById: adminId,
        },
        {
          childId: firstChild.id,
          kind: 'PEDIATRICIAN',
          priority: 'MEDIUM',
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
          reason: 'Follow-up developmental screening at the 24-month check.',
          createdById: adminId,
        },
      ],
    });
    console.log('Seeded referrals.');
  }
}

async function main(): Promise<void> {
  const admin = await seedUsers();
  await seedAsq3Questionnaires(admin.id);
  await archiveLegacySample();
  await seedAdminDomain(admin.id);

  console.log('Seed complete.');
  console.log(`  Admin:  admin@namo.local  / ${SEED_PASSWORD}`);
  console.log(`  Parent: parent@namo.local / ${SEED_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
