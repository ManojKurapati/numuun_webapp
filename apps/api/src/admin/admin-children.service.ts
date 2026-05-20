import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Paginated, Zone } from '@namo/types';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { ageInMonths } from '../common/util/age.util';

export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';

export interface AdminChildRow {
  id: string;
  firstName: string;
  lastName: string | null;
  gender: string;
  dateOfBirth: string;
  ageMonths: number;
  parent: { id: string; fullName: string; email: string; phone: string | null };
  assessmentCount: number;
  lastAssessmentAt: string | null;
  latestZone: Zone | null;
  delayDomainCount: number;
  riskLevel: RiskLevel;
  riskScore: number;
}

export interface AdminChildProfile extends AdminChildRow {
  createdAt: string;
  gestationalAgeWeeks: number | null;
  assessments: {
    id: string;
    status: string;
    childAgeMonths: number;
    totalScore: number | null;
    totalMaxScore: number | null;
    overallZone: Zone | null;
    completedAt: string | null;
    createdAt: string;
    questionnaireId: string;
    questionnaireTitle: string;
    domainScores: {
      domainCode: string;
      domainName: string;
      rawScore: number;
      maxScore: number;
      zone: Zone;
    }[];
  }[];
  notes: {
    id: string;
    kind: string;
    body: string;
    authorName: string;
    createdAt: string;
  }[];
  referrals: {
    id: string;
    kind: string;
    priority: string;
    status: string;
    reason: string;
    createdAt: string;
    scheduledAt: string | null;
    completedAt: string | null;
  }[];
}

const CHILD_INCLUDE = {
  parent: { select: { id: true, fullName: true, email: true, phone: true } },
  assessments: {
    where: { deletedAt: null },
    orderBy: { createdAt: 'desc' as const },
    include: {
      domainScores: { include: { domain: true } },
      questionnaire: { select: { id: true, title: true } },
    },
  },
} satisfies Prisma.ChildInclude;

type ChildWithGraph = Prisma.ChildGetPayload<{ include: typeof CHILD_INCLUDE }>;

/** Admin clinical operations for child records: search, profile, risk. */
@Injectable()
export class AdminChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    q?: string;
    riskLevel?: RiskLevel;
    ageMinMonths?: number;
    ageMaxMonths?: number;
    page: number;
    pageSize: number;
  }): Promise<Paginated<AdminChildRow>> {
    const where: Prisma.ChildWhereInput = { deletedAt: null };

    if (params.q && params.q.length > 0) {
      const term = params.q.trim();
      where.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { parent: { fullName: { contains: term, mode: 'insensitive' } } },
        { parent: { email: { contains: term, mode: 'insensitive' } } },
        { parent: { phone: { contains: term } } },
      ];
    }

    // Filter by date of birth bounds derived from ageMin/Max months (today minus N months).
    if (params.ageMinMonths !== undefined || params.ageMaxMonths !== undefined) {
      const today = new Date();
      const bounds: Prisma.DateTimeFilter = {};
      if (params.ageMaxMonths !== undefined) {
        bounds.gte = monthsAgo(today, params.ageMaxMonths + 1);
      }
      if (params.ageMinMonths !== undefined) {
        bounds.lte = monthsAgo(today, params.ageMinMonths);
      }
      where.dateOfBirth = bounds;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.child.findMany({
        where,
        include: CHILD_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.child.count({ where }),
    ]);

    let rows = items.map((child) => this.toRow(child));
    if (params.riskLevel) {
      rows = rows.filter((row) => row.riskLevel === params.riskLevel);
    }

    return { items: rows, page: params.page, pageSize: params.pageSize, total };
  }

  /** Lightweight risk-aware list of every child, used by the high-risk queue. */
  async listAllForRisk(): Promise<AdminChildRow[]> {
    const items = await this.prisma.child.findMany({
      where: { deletedAt: null },
      include: CHILD_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((child) => this.toRow(child));
  }

  async getProfile(id: string): Promise<AdminChildProfile> {
    const child = await this.prisma.child.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...CHILD_INCLUDE,
        notes: { include: { author: { select: { fullName: true } } }, orderBy: { createdAt: 'desc' } },
        referrals: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!child) {
      throw AppException.notFound('CHILD_NOT_FOUND', 'Child not found.');
    }
    const row = this.toRow(child);
    return {
      ...row,
      createdAt: child.createdAt.toISOString(),
      gestationalAgeWeeks: child.gestationalAgeWeeks,
      assessments: child.assessments.map((assessment) => ({
        id: assessment.id,
        status: assessment.status,
        childAgeMonths: assessment.childAgeMonths,
        totalScore: assessment.totalScore,
        totalMaxScore: assessment.totalMaxScore,
        overallZone: assessment.overallZone as Zone | null,
        completedAt: assessment.completedAt?.toISOString() ?? null,
        createdAt: assessment.createdAt.toISOString(),
        questionnaireId: assessment.questionnaireId,
        questionnaireTitle: assessment.questionnaire.title,
        domainScores: assessment.domainScores.map((score) => ({
          domainCode: score.domain.code,
          domainName: score.domain.name,
          rawScore: score.rawScore,
          maxScore: score.maxScore,
          zone: score.zone as Zone,
        })),
      })),
      notes: child.notes.map((note) => ({
        id: note.id,
        kind: note.kind,
        body: note.body,
        authorName: note.author.fullName,
        createdAt: note.createdAt.toISOString(),
      })),
      referrals: child.referrals.map((referral) => ({
        id: referral.id,
        kind: referral.kind,
        priority: referral.priority,
        status: referral.status,
        reason: referral.reason,
        createdAt: referral.createdAt.toISOString(),
        scheduledAt: referral.scheduledAt?.toISOString() ?? null,
        completedAt: referral.completedAt?.toISOString() ?? null,
      })),
    };
  }

  async addNote(childId: string, authorId: string, body: string, kind: string): Promise<void> {
    const child = await this.prisma.child.findFirst({ where: { id: childId, deletedAt: null } });
    if (!child) throw AppException.notFound('CHILD_NOT_FOUND', 'Child not found.');
    await this.prisma.childNote.create({
      data: { childId, authorId, body, kind },
    });
  }

  private toRow(child: ChildWithGraph): AdminChildRow {
    const ageMonths = ageInMonths(child.dateOfBirth);
    const completed = child.assessments.filter((a) => a.status === 'COMPLETED');
    const last = completed[0] ?? null;
    const delayDomainCount = last
      ? last.domainScores.filter((score) => score.zone === 'DELAY').length
      : 0;
    const { riskLevel, riskScore } = this.computeRisk(child);

    return {
      id: child.id,
      firstName: child.firstName,
      lastName: child.lastName,
      gender: child.gender,
      dateOfBirth: child.dateOfBirth.toISOString().slice(0, 10),
      ageMonths,
      parent: {
        id: child.parent.id,
        fullName: child.parent.fullName,
        email: child.parent.email,
        phone: child.parent.phone,
      },
      assessmentCount: child.assessments.length,
      lastAssessmentAt: last?.completedAt?.toISOString() ?? last?.createdAt?.toISOString() ?? null,
      latestZone: (last?.overallZone as Zone | null) ?? null,
      delayDomainCount,
      riskLevel,
      riskScore,
    };
  }

  /**
   * Heuristic risk score from a child's assessment history.
   * Higher score = higher risk. Drives the high-risk queue and tile colors.
   */
  private computeRisk(child: ChildWithGraph): { riskLevel: RiskLevel; riskScore: number } {
    const completed = child.assessments.filter((a) => a.status === 'COMPLETED');
    if (completed.length === 0) {
      return { riskLevel: 'NONE', riskScore: 0 };
    }
    const last = completed[0];
    const lastDelays = last.domainScores.filter((score) => score.zone === 'DELAY').length;
    const lastGreys = last.domainScores.filter((score) => score.zone === 'GREY_ZONE').length;

    // Regression signal: any domain whose score dropped vs. previous assessment.
    let regressionCount = 0;
    if (completed.length >= 2) {
      const prev = completed[1];
      const prevByDomain = new Map(prev.domainScores.map((s) => [s.domainId, s.rawScore]));
      for (const score of last.domainScores) {
        const prior = prevByDomain.get(score.domainId);
        if (prior !== undefined && score.rawScore < prior) regressionCount += 1;
      }
    }

    const score = lastDelays * 3 + lastGreys + regressionCount * 2;
    let riskLevel: RiskLevel;
    if (lastDelays >= 3 || score >= 9) riskLevel = 'CRITICAL';
    else if (lastDelays >= 2 || score >= 6) riskLevel = 'HIGH';
    else if (lastDelays >= 1 || score >= 3) riskLevel = 'MEDIUM';
    else if (lastGreys >= 1) riskLevel = 'LOW';
    else riskLevel = 'NONE';

    return { riskLevel, riskScore: score };
  }
}

function monthsAgo(from: Date, months: number): Date {
  const result = new Date(from);
  result.setMonth(result.getMonth() - months);
  return result;
}
