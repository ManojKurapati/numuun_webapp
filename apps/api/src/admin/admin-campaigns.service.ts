import { Injectable } from '@nestjs/common';
import { Campaign, Prisma } from '@prisma/client';
import { Paginated } from '@namo/types';
import { CreateCampaignInput, UpdateCampaignInput } from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';

export interface CampaignRow {
  id: string;
  title: string;
  body: string;
  channel: string;
  audienceRoles: string[];
  status: string;
  scheduledFor: string | null;
  sentAt: string | null;
  recipientCount: number;
  createdBy: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
}

const INCLUDE = {
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.CampaignInclude;

type FullCampaign = Prisma.CampaignGetPayload<{ include: typeof INCLUDE }>;

@Injectable()
export class AdminCampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    status?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<CampaignRow>> {
    const where: Prisma.CampaignWhereInput = { deletedAt: null };
    if (params.status) where.status = params.status as Campaign['status'];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.campaign.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.campaign.count({ where }),
    ]);

    return {
      items: items.map((campaign) => this.toRow(campaign)),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  }

  async create(actorId: string, input: CreateCampaignInput): Promise<CampaignRow> {
    const created = await this.prisma.campaign.create({
      data: {
        title: input.title,
        body: input.body,
        channel: input.channel,
        audienceRoles: input.audienceRoles.join(','),
        scheduledFor: input.scheduledFor ?? null,
        status: input.scheduledFor ? 'SCHEDULED' : 'DRAFT',
        createdById: actorId,
      },
      include: INCLUDE,
    });
    return this.toRow(created);
  }

  async update(id: string, input: UpdateCampaignInput): Promise<CampaignRow> {
    const existing = await this.prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw AppException.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found.');

    const data: Prisma.CampaignUpdateInput = {};
    if (input.title !== undefined) data.title = input.title;
    if (input.body !== undefined) data.body = input.body;
    if (input.channel !== undefined) data.channel = input.channel;
    if (input.audienceRoles !== undefined) data.audienceRoles = input.audienceRoles.join(',');
    if (input.scheduledFor !== undefined) data.scheduledFor = input.scheduledFor;
    if (input.status !== undefined) data.status = input.status;

    const updated = await this.prisma.campaign.update({ where: { id }, data, include: INCLUDE });
    return this.toRow(updated);
  }

  /** Mark a campaign as sent. Real delivery is out of scope. */
  async send(id: string): Promise<CampaignRow> {
    const existing = await this.prisma.campaign.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw AppException.notFound('CAMPAIGN_NOT_FOUND', 'Campaign not found.');
    if (existing.status === 'SENT') {
      throw AppException.conflict('CAMPAIGN_ALREADY_SENT', 'This campaign has already been sent.');
    }

    const targetRoles = existing.audienceRoles.split(',').filter(Boolean);
    const recipientCount = await this.prisma.user.count({
      where: {
        deletedAt: null,
        isActive: true,
        role: { in: targetRoles as Prisma.EnumUserRoleFilter['in'] },
      },
    });

    const updated = await this.prisma.campaign.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date(), recipientCount },
      include: INCLUDE,
    });
    return this.toRow(updated);
  }

  private toRow(campaign: FullCampaign): CampaignRow {
    return {
      id: campaign.id,
      title: campaign.title,
      body: campaign.body,
      channel: campaign.channel,
      audienceRoles: campaign.audienceRoles.split(',').filter(Boolean),
      status: campaign.status,
      scheduledFor: campaign.scheduledFor?.toISOString() ?? null,
      sentAt: campaign.sentAt?.toISOString() ?? null,
      recipientCount: campaign.recipientCount,
      createdBy: { id: campaign.createdBy.id, fullName: campaign.createdBy.fullName },
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }
}
