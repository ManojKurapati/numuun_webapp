import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

export interface PlatformOverview {
  users: { total: number; byRole: Record<string, number> };
  children: { total: number };
  questionnaires: { total: number; byStatus: Record<string, number> };
  assessments: {
    total: number;
    byStatus: Record<string, number>;
    zoneDistribution: Record<string, number>;
  };
}

/** Aggregated, privacy-safe metrics for the admin dashboard. */
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(): Promise<PlatformOverview> {
    const [usersByRole, childCount, questionnairesByStatus, assessmentsByStatus, zoneGroups] =
      await this.prisma.$transaction([
        this.prisma.user.groupBy({
          by: ['role'],
          where: { deletedAt: null },
          _count: { _all: true },
          orderBy: { role: 'asc' },
        }),
        this.prisma.child.count({ where: { deletedAt: null } }),
        this.prisma.questionnaire.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.assessment.groupBy({
          by: ['status'],
          where: { deletedAt: null },
          _count: { _all: true },
          orderBy: { status: 'asc' },
        }),
        this.prisma.assessment.groupBy({
          by: ['overallZone'],
          where: { deletedAt: null, status: 'COMPLETED' },
          _count: { _all: true },
          orderBy: { overallZone: 'asc' },
        }),
      ]);

    const userByRole = this.tally(usersByRole, 'role');
    const questionnaireByStatus = this.tally(questionnairesByStatus, 'status');
    const assessmentByStatus = this.tally(assessmentsByStatus, 'status');
    const zoneDistribution = this.tally(zoneGroups, 'overallZone');

    return {
      users: { total: this.sum(userByRole), byRole: userByRole },
      children: { total: childCount },
      questionnaires: { total: this.sum(questionnaireByStatus), byStatus: questionnaireByStatus },
      assessments: {
        total: this.sum(assessmentByStatus),
        byStatus: assessmentByStatus,
        zoneDistribution,
      },
    };
  }

  /** Reduce a Prisma `groupBy` result into a `{ value: count }` map. */
  private tally(groups: unknown[], key: string): Record<string, number> {
    const result: Record<string, number> = {};
    for (const raw of groups) {
      const group = raw as Record<string, unknown> & { _count?: { _all?: number } };
      const value = (group[key] as string | null | undefined) ?? 'UNKNOWN';
      result[value] = group._count?._all ?? 0;
    }
    return result;
  }

  private sum(counts: Record<string, number>): number {
    return Object.values(counts).reduce((total, count) => total + count, 0);
  }
}
