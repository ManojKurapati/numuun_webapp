import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Paginated } from '@namo/types';
import { PrismaService } from '../common/prisma/prisma.service';

export interface AuditEntryRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  actor: { id: string; fullName: string; email: string; role: string } | null;
  ipAddress: string | null;
  metadata: unknown;
  createdAt: string;
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    actorId?: string;
    entityType?: string;
    action?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<AuditEntryRow>> {
    const where: Prisma.AuditLogWhereInput = {};
    if (params.actorId) where.actorId = params.actorId;
    if (params.entityType) where.entityType = params.entityType;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, fullName: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        actor: entry.actor
          ? {
              id: entry.actor.id,
              fullName: entry.actor.fullName,
              email: entry.actor.email,
              role: entry.actor.role,
            }
          : null,
        ipAddress: entry.ipAddress,
        metadata: entry.metadata,
        createdAt: entry.createdAt.toISOString(),
      })),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  }
}
