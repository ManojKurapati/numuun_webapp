import { Injectable } from '@nestjs/common';
import { Prisma, Referral } from '@prisma/client';
import { Paginated } from '@namo/types';
import { CreateReferralInput, UpdateReferralInput } from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';

export interface ReferralRow {
  id: string;
  child: { id: string; name: string; ageMonths: number };
  kind: string;
  priority: string;
  status: string;
  reason: string;
  notes: string | null;
  outcome: string | null;
  assignee: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string };
  scheduledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const INCLUDE = {
  child: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
  assignee: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.ReferralInclude;

type FullReferral = Prisma.ReferralGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class AdminReferralsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    status?: string;
    priority?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<ReferralRow>> {
    const where: Prisma.ReferralWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status as Referral['status'];
    if (params.priority) where.priority = params.priority as Referral['priority'];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.referral.findMany({
        where,
        include: INCLUDE,
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.referral.count({ where }),
    ]);

    return {
      items: items.map((referral) => this.toRow(referral)),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  }

  async listForChild(childId: string): Promise<ReferralRow[]> {
    const items = await this.prisma.referral.findMany({
      where: { childId, deletedAt: null },
      include: INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return items.map((referral) => this.toRow(referral));
  }

  async create(actorId: string, input: CreateReferralInput): Promise<ReferralRow> {
    const child = await this.prisma.child.findFirst({
      where: { id: input.childId, deletedAt: null },
      select: { id: true },
    });
    if (!child) throw AppException.notFound('CHILD_NOT_FOUND', 'Child not found.');

    const created = await this.prisma.referral.create({
      data: {
        childId: input.childId,
        kind: input.kind,
        priority: input.priority,
        reason: input.reason,
        notes: input.notes ?? null,
        createdById: actorId,
      },
      include: INCLUDE,
    });
    return this.toRow(created);
  }

  async update(id: string, input: UpdateReferralInput): Promise<ReferralRow> {
    const existing = await this.prisma.referral.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw AppException.notFound('REFERRAL_NOT_FOUND', 'Referral not found.');

    const data: Prisma.ReferralUpdateInput = {};
    if (input.status !== undefined) {
      data.status = input.status;
      if (input.status === 'COMPLETED' || input.status === 'CANCELLED') {
        data.completedAt = new Date();
      }
    }
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.assigneeId !== undefined) {
      data.assignee = input.assigneeId ? { connect: { id: input.assigneeId } } : { disconnect: true };
    }
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.outcome !== undefined) data.outcome = input.outcome;
    if (input.scheduledAt !== undefined) data.scheduledAt = input.scheduledAt;

    const updated = await this.prisma.referral.update({
      where: { id },
      data,
      include: INCLUDE,
    });
    return this.toRow(updated);
  }

  private toRow(referral: FullReferral): ReferralRow {
    const now = new Date();
    const dob = referral.child.dateOfBirth;
    const ageMonths =
      (now.getFullYear() - dob.getFullYear()) * 12 + (now.getMonth() - dob.getMonth());
    return {
      id: referral.id,
      child: {
        id: referral.child.id,
        name: `${referral.child.firstName} ${referral.child.lastName ?? ''}`.trim(),
        ageMonths,
      },
      kind: referral.kind,
      priority: referral.priority,
      status: referral.status,
      reason: referral.reason,
      notes: referral.notes,
      outcome: referral.outcome,
      assignee: referral.assignee ? { id: referral.assignee.id, fullName: referral.assignee.fullName } : null,
      createdBy: { id: referral.createdBy.id, fullName: referral.createdBy.fullName },
      scheduledAt: referral.scheduledAt?.toISOString() ?? null,
      completedAt: referral.completedAt?.toISOString() ?? null,
      createdAt: referral.createdAt.toISOString(),
      updatedAt: referral.updatedAt.toISOString(),
    };
  }
}
