import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { AdminChildrenService, type RiskLevel } from './admin-children.service';

interface ScoreFixture {
  domainId: string;
  rawScore: number;
  zone: 'NORMAL' | 'GREY_ZONE' | 'DELAY';
}

interface AssessmentFixture {
  status: 'COMPLETED' | 'IN_PROGRESS';
  completedAt?: Date;
  createdAt: Date;
  overallZone?: 'NORMAL' | 'GREY_ZONE' | 'DELAY';
  domainScores: ScoreFixture[];
}

function makeChild(assessments: AssessmentFixture[]) {
  return {
    id: 'child-1',
    parentId: 'parent-1',
    firstName: 'Test',
    lastName: 'Child',
    dateOfBirth: new Date('2024-01-01'),
    gender: 'OTHER',
    gestationalAgeWeeks: null,
    createdAt: new Date(),
    parent: {
      id: 'parent-1',
      fullName: 'Test Parent',
      email: 'parent@example.com',
      phone: null,
    },
    assessments: assessments.map((assessment, index) => ({
      id: `assess-${index}`,
      status: assessment.status,
      completedAt: assessment.completedAt ?? null,
      createdAt: assessment.createdAt,
      childAgeMonths: 12,
      totalScore: null,
      totalMaxScore: null,
      overallZone: assessment.overallZone ?? null,
      questionnaireId: 'q-1',
      questionnaire: { id: 'q-1', title: 'Test ASQ' },
      domainScores: assessment.domainScores.map((score) => ({
        domainId: score.domainId,
        rawScore: score.rawScore,
        maxScore: 60,
        zone: score.zone,
        domain: { code: score.domainId.toUpperCase(), name: score.domainId },
      })),
    })),
  } as unknown as Parameters<AdminChildrenService['listAllForRisk']>[number] extends never
    ? never
    : never;
}

describe('AdminChildrenService risk computation', () => {
  let service: AdminChildrenService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AdminChildrenService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();
    service = module.get(AdminChildrenService);
  });

  // computeRisk is private; we exercise it through the row mapper via a tiny shim.
  const toRow = (assessments: AssessmentFixture[]): { riskLevel: RiskLevel; delayDomainCount: number; riskScore: number } => {
    const child = makeChild(assessments);
    const result = (service as unknown as { toRow: (c: unknown) => { riskLevel: RiskLevel; delayDomainCount: number; riskScore: number } }).toRow(child);
    return result;
  };

  it('returns NONE when no completed assessments exist', () => {
    const row = toRow([
      { status: 'IN_PROGRESS', createdAt: new Date(), domainScores: [] },
    ]);
    expect(row.riskLevel).toBe('NONE');
    expect(row.riskScore).toBe(0);
  });

  it('returns NONE when all domains are on track', () => {
    const row = toRow([
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        domainScores: [
          { domainId: 'a', rawScore: 50, zone: 'NORMAL' },
          { domainId: 'b', rawScore: 55, zone: 'NORMAL' },
        ],
      },
    ]);
    expect(row.riskLevel).toBe('NONE');
  });

  it('returns LOW when only a grey-zone domain is present', () => {
    const row = toRow([
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        domainScores: [
          { domainId: 'a', rawScore: 35, zone: 'GREY_ZONE' },
          { domainId: 'b', rawScore: 50, zone: 'NORMAL' },
        ],
      },
    ]);
    expect(row.riskLevel).toBe('LOW');
  });

  it('returns MEDIUM with one DELAY domain', () => {
    const row = toRow([
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        domainScores: [
          { domainId: 'a', rawScore: 10, zone: 'DELAY' },
          { domainId: 'b', rawScore: 50, zone: 'NORMAL' },
        ],
      },
    ]);
    expect(row.riskLevel).toBe('MEDIUM');
    expect(row.delayDomainCount).toBe(1);
  });

  it('returns HIGH with two DELAY domains', () => {
    const row = toRow([
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        domainScores: [
          { domainId: 'a', rawScore: 10, zone: 'DELAY' },
          { domainId: 'b', rawScore: 10, zone: 'DELAY' },
        ],
      },
    ]);
    expect(row.riskLevel).toBe('HIGH');
    expect(row.delayDomainCount).toBe(2);
  });

  it('returns CRITICAL with three or more DELAY domains', () => {
    const row = toRow([
      {
        status: 'COMPLETED',
        completedAt: new Date(),
        createdAt: new Date(),
        domainScores: [
          { domainId: 'a', rawScore: 10, zone: 'DELAY' },
          { domainId: 'b', rawScore: 10, zone: 'DELAY' },
          { domainId: 'c', rawScore: 10, zone: 'DELAY' },
        ],
      },
    ]);
    expect(row.riskLevel).toBe('CRITICAL');
    expect(row.delayDomainCount).toBe(3);
  });

  it('amplifies risk when scores have regressed since the previous assessment', () => {
    const baseline: AssessmentFixture = {
      status: 'COMPLETED',
      completedAt: new Date('2026-03-01'),
      createdAt: new Date('2026-02-15'),
      domainScores: [
        { domainId: 'a', rawScore: 50, zone: 'NORMAL' },
        { domainId: 'b', rawScore: 50, zone: 'NORMAL' },
      ],
    };
    const latest: AssessmentFixture = {
      status: 'COMPLETED',
      completedAt: new Date('2026-05-01'),
      createdAt: new Date('2026-04-15'),
      domainScores: [
        { domainId: 'a', rawScore: 10, zone: 'DELAY' },
        { domainId: 'b', rawScore: 20, zone: 'GREY_ZONE' },
      ],
    };
    // The service expects assessments ordered newest-first (Prisma orderBy desc).
    const row = toRow([latest, baseline]);
    // 1 delay (3) + 1 grey (1) + 2 regressions (4) = 8 → still HIGH bucket.
    expect(['HIGH', 'CRITICAL']).toContain(row.riskLevel);
    expect(row.riskScore).toBeGreaterThanOrEqual(6);
  });
});
