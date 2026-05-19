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

async function main(): Promise<void> {
  const admin = await seedUsers();
  await seedAsq3Questionnaires(admin.id);
  await archiveLegacySample();

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
