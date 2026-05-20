import { Injectable } from '@nestjs/common';
import { Prisma, Intervention } from '@prisma/client';
import { Paginated } from '@namo/types';
import { CreateInterventionInput, UpdateInterventionInput } from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';

export interface InterventionRow {
  id: string;
  title: string;
  description: string;
  domainCodes: string[];
  ageMinMonths: number;
  ageMaxMonths: number;
  difficulty: string;
  durationMinutes: number;
  materials: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  effectiveness: number | null;
  views: number;
  completions: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class AdminInterventionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    domain?: string;
    published?: boolean;
    page: number;
    pageSize: number;
  }): Promise<Paginated<InterventionRow>> {
    const where: Prisma.InterventionWhereInput = { deletedAt: null };
    if (params.published !== undefined) where.isPublished = params.published;
    if (params.domain) where.domainCodes = { contains: params.domain };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.intervention.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.intervention.count({ where }),
    ]);

    return {
      items: items.map((row) => this.toRow(row)),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  }

  async get(id: string): Promise<InterventionRow> {
    const row = await this.prisma.intervention.findFirst({ where: { id, deletedAt: null } });
    if (!row) throw AppException.notFound('INTERVENTION_NOT_FOUND', 'Intervention not found.');
    return this.toRow(row);
  }

  async create(actorId: string, input: CreateInterventionInput): Promise<InterventionRow> {
    if (input.ageMaxMonths < input.ageMinMonths) {
      throw AppException.badRequest('AGE_RANGE_INVALID', 'ageMaxMonths must be >= ageMinMonths.');
    }
    const created = await this.prisma.intervention.create({
      data: {
        title: input.title,
        description: input.description,
        domainCodes: input.domainCodes.join(','),
        ageMinMonths: input.ageMinMonths,
        ageMaxMonths: input.ageMaxMonths,
        difficulty: input.difficulty,
        durationMinutes: input.durationMinutes,
        materials: input.materials ?? null,
        videoUrl: input.videoUrl ?? null,
        thumbnailUrl: input.thumbnailUrl ?? null,
        createdById: actorId,
      },
    });
    return this.toRow(created);
  }

  async update(id: string, input: UpdateInterventionInput): Promise<InterventionRow> {
    const existing = await this.prisma.intervention.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw AppException.notFound('INTERVENTION_NOT_FOUND', 'Intervention not found.');

    const data: Prisma.InterventionUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description;
    if (input.domainCodes !== undefined) data.domainCodes = input.domainCodes.join(',');
    if (input.ageMinMonths !== undefined) data.ageMinMonths = input.ageMinMonths;
    if (input.ageMaxMonths !== undefined) data.ageMaxMonths = input.ageMaxMonths;
    if (input.difficulty !== undefined) data.difficulty = input.difficulty;
    if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
    if (input.materials !== undefined) data.materials = input.materials;
    if (input.videoUrl !== undefined) data.videoUrl = input.videoUrl;
    if (input.thumbnailUrl !== undefined) data.thumbnailUrl = input.thumbnailUrl;
    if (input.isPublished !== undefined) data.isPublished = input.isPublished;

    const updated = await this.prisma.intervention.update({ where: { id }, data });
    return this.toRow(updated);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.intervention.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw AppException.notFound('INTERVENTION_NOT_FOUND', 'Intervention not found.');
    await this.prisma.intervention.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toRow(row: Intervention): InterventionRow {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      domainCodes: row.domainCodes ? row.domainCodes.split(',').map((c) => c.trim()).filter(Boolean) : [],
      ageMinMonths: row.ageMinMonths,
      ageMaxMonths: row.ageMaxMonths,
      difficulty: row.difficulty,
      durationMinutes: row.durationMinutes,
      materials: row.materials,
      videoUrl: row.videoUrl,
      thumbnailUrl: row.thumbnailUrl,
      effectiveness: row.effectiveness,
      views: row.views,
      completions: row.completions,
      isPublished: row.isPublished,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
