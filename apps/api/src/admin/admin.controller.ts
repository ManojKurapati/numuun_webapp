import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { Paginated } from '@namo/types';
import {
  AuditQueryInput,
  auditQuerySchema,
  CAMPAIGN_STATUSES,
  childSearchSchema,
  createCampaignSchema,
  CreateCampaignInput,
  createChildNoteSchema,
  CreateChildNoteInput,
  createInterventionSchema,
  CreateInterventionInput,
  createReferralSchema,
  CreateReferralInput,
  createUploadSchema,
  CreateUploadInput,
  REFERRAL_PRIORITIES,
  REFERRAL_STATUSES,
  paginationSchema,
  reviewUploadSchema,
  ReviewUploadInput,
  UPLOAD_STATUSES,
  updateCampaignSchema,
  UpdateCampaignInput,
  updateInterventionSchema,
  UpdateInterventionInput,
  updateReferralSchema,
  UpdateReferralInput,
} from '@namo/validation';
import { AssessmentSummary, toSummary } from '../assessments/assessment.mapper';
import { AssessmentsService } from '../assessments/assessments.service';
import { AuditService } from '../audit/audit.service';
import { PublicChild, toPublicChild } from '../children/child.types';
import { ChildrenService } from '../children/children.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminAuditService, AuditEntryRow } from './admin-audit.service';
import { AdminCampaignsService, CampaignRow } from './admin-campaigns.service';
import { AdminChildrenService, AdminChildProfile, AdminChildRow, RiskLevel } from './admin-children.service';
import { AdminInterventionsService, InterventionRow } from './admin-interventions.service';
import { AdminReferralsService, ReferralRow } from './admin-referrals.service';
import { AdminUploadsService, UploadDetail, UploadRow } from './admin-uploads.service';
import { AdminService, ExecutiveSnapshot, PlatformOverview } from './admin.service';

const RISK_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NONE'] as const;

const interventionListSchema = paginationSchema.extend({
  domain: z.string().trim().min(1).max(8).optional(),
  published: z.enum(['true', 'false']).optional(),
});

const referralListSchema = paginationSchema.extend({
  status: z.enum(REFERRAL_STATUSES).optional(),
  priority: z.enum(REFERRAL_PRIORITIES).optional(),
});

const uploadListSchema = paginationSchema.extend({
  status: z.enum(UPLOAD_STATUSES).optional(),
});

const campaignListSchema = paginationSchema.extend({
  status: z.enum(CAMPAIGN_STATUSES).optional(),
});

const highRiskQuerySchema = z.object({
  minRiskLevel: z.enum(RISK_LEVELS).optional(),
});

/** Admin-only oversight, ops, and intelligence endpoints. */
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly adminChildren: AdminChildrenService,
    private readonly adminReferrals: AdminReferralsService,
    private readonly adminInterventions: AdminInterventionsService,
    private readonly adminUploads: AdminUploadsService,
    private readonly adminCampaigns: AdminCampaignsService,
    private readonly adminAudit: AdminAuditService,
    private readonly children: ChildrenService,
    private readonly assessments: AssessmentsService,
    private readonly audit: AuditService,
  ) {}

  // ---- Dashboards ----------------------------------------------------------

  @Get('stats')
  overview(): Promise<PlatformOverview> {
    return this.admin.overview();
  }

  @Get('executive')
  executive(): Promise<ExecutiveSnapshot> {
    return this.admin.executive();
  }

  @Get('system-health')
  systemHealth(): ReturnType<AdminService['systemHealth']> {
    return this.admin.systemHealth();
  }

  // ---- Children ------------------------------------------------------------

  @Get('children')
  async listChildren(
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; pageSize: number },
  ): Promise<Paginated<PublicChild>> {
    const result = await this.children.listAll(query.page, query.pageSize);
    return { ...result, items: result.items.map(toPublicChild) };
  }

  @Get('children/search')
  searchChildren(
    @Query(new ZodValidationPipe(childSearchSchema))
    query: {
      q?: string;
      riskLevel?: RiskLevel;
      ageMinMonths?: number;
      ageMaxMonths?: number;
      page: number;
      pageSize: number;
    },
  ): Promise<Paginated<AdminChildRow>> {
    return this.adminChildren.search(query);
  }

  @Get('children/high-risk')
  async highRiskQueue(
    @Query(new ZodValidationPipe(highRiskQuerySchema))
    query: { minRiskLevel?: (typeof RISK_LEVELS)[number] },
  ): Promise<{ items: AdminChildRow[] }> {
    const all = await this.adminChildren.listAllForRisk();
    const order: Record<RiskLevel, number> = {
      CRITICAL: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
      NONE: 0,
    };
    const min = order[(query.minRiskLevel ?? 'HIGH') as RiskLevel] ?? 3;
    const filtered = all
      .filter((row) => order[row.riskLevel] >= min)
      .sort((a, b) => order[b.riskLevel] - order[a.riskLevel] || b.riskScore - a.riskScore);
    return { items: filtered };
  }

  @Get('children/:id')
  getChildProfile(@Param('id', ParseUUIDPipe) id: string): Promise<AdminChildProfile> {
    return this.adminChildren.getProfile(id);
  }

  @Post('children/:id/notes')
  async addChildNote(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(createChildNoteSchema)) input: CreateChildNoteInput,
  ): Promise<{ added: true }> {
    await this.adminChildren.addNote(id, actorId, input.body, input.kind);
    await this.audit.record({
      actorId,
      action: 'CHILD_NOTE_ADDED',
      entityType: 'Child',
      entityId: id,
    });
    return { added: true };
  }

  // ---- Assessments ---------------------------------------------------------

  @Get('assessments')
  async listAssessments(
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; pageSize: number },
  ): Promise<Paginated<AssessmentSummary>> {
    const result = await this.assessments.listAll(query.page, query.pageSize);
    return { ...result, items: result.items.map(toSummary) };
  }

  // ---- Referrals -----------------------------------------------------------

  @Get('referrals')
  listReferrals(
    @Query(new ZodValidationPipe(referralListSchema))
    query: { status?: string; priority?: string; page: number; pageSize: number },
  ): Promise<Paginated<ReferralRow>> {
    return this.adminReferrals.list(query);
  }

  @Post('referrals')
  async createReferral(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(createReferralSchema)) input: CreateReferralInput,
  ): Promise<ReferralRow> {
    const referral = await this.adminReferrals.create(actorId, input);
    await this.audit.record({
      actorId,
      action: 'REFERRAL_CREATED',
      entityType: 'Referral',
      entityId: referral.id,
      metadata: { kind: input.kind, priority: input.priority },
    });
    return referral;
  }

  @Patch('referrals/:id')
  async updateReferral(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateReferralSchema)) input: UpdateReferralInput,
  ): Promise<ReferralRow> {
    const updated = await this.adminReferrals.update(id, input);
    await this.audit.record({
      actorId,
      action: 'REFERRAL_UPDATED',
      entityType: 'Referral',
      entityId: id,
      metadata: JSON.parse(JSON.stringify(input)) as never,
    });
    return updated;
  }

  // ---- Interventions / video library --------------------------------------

  @Get('interventions')
  listInterventions(
    @Query(new ZodValidationPipe(interventionListSchema))
    query: { domain?: string; published?: 'true' | 'false'; page: number; pageSize: number },
  ): Promise<Paginated<InterventionRow>> {
    return this.adminInterventions.list({
      domain: query.domain,
      published: query.published === undefined ? undefined : query.published === 'true',
      page: query.page,
      pageSize: query.pageSize,
    });
  }

  @Get('interventions/:id')
  getIntervention(@Param('id', ParseUUIDPipe) id: string): Promise<InterventionRow> {
    return this.adminInterventions.get(id);
  }

  @Post('interventions')
  async createIntervention(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(createInterventionSchema)) input: CreateInterventionInput,
  ): Promise<InterventionRow> {
    const created = await this.adminInterventions.create(actorId, input);
    await this.audit.record({
      actorId,
      action: 'INTERVENTION_CREATED',
      entityType: 'Intervention',
      entityId: created.id,
    });
    return created;
  }

  @Patch('interventions/:id')
  async updateIntervention(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateInterventionSchema)) input: UpdateInterventionInput,
  ): Promise<InterventionRow> {
    const updated = await this.adminInterventions.update(id, input);
    await this.audit.record({
      actorId,
      action: 'INTERVENTION_UPDATED',
      entityType: 'Intervention',
      entityId: id,
    });
    return updated;
  }

  // ---- AI extraction review ------------------------------------------------

  @Get('uploads')
  listUploads(
    @Query(new ZodValidationPipe(uploadListSchema))
    query: { status?: string; page: number; pageSize: number },
  ): Promise<Paginated<UploadRow>> {
    return this.adminUploads.list(query);
  }

  @Get('uploads/:id')
  getUpload(@Param('id', ParseUUIDPipe) id: string): Promise<UploadDetail> {
    return this.adminUploads.get(id);
  }

  @Post('uploads')
  async createUpload(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(createUploadSchema)) input: CreateUploadInput,
  ): Promise<UploadRow> {
    const upload = await this.adminUploads.create(actorId, input);
    await this.audit.record({
      actorId,
      action: 'UPLOAD_CREATED',
      entityType: 'QuestionnaireUpload',
      entityId: upload.id,
      metadata: { fileName: input.fileName },
    });
    return upload;
  }

  @Post('uploads/:id/extract')
  async extractUpload(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<UploadDetail> {
    const result = await this.adminUploads.runExtraction(id);
    await this.audit.record({
      actorId,
      action: 'UPLOAD_EXTRACTION_RAN',
      entityType: 'QuestionnaireUpload',
      entityId: id,
    });
    return result;
  }

  @Patch('uploads/:id/review')
  async reviewUpload(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(reviewUploadSchema)) input: ReviewUploadInput,
  ): Promise<UploadDetail> {
    const result = await this.adminUploads.review(id, actorId, input);
    await this.audit.record({
      actorId,
      action: `UPLOAD_${input.status}`,
      entityType: 'QuestionnaireUpload',
      entityId: id,
      metadata: { reviewNotes: input.reviewNotes },
    });
    return result;
  }

  // ---- Campaigns / notifications ------------------------------------------

  @Get('campaigns')
  listCampaigns(
    @Query(new ZodValidationPipe(campaignListSchema))
    query: { status?: string; page: number; pageSize: number },
  ): Promise<Paginated<CampaignRow>> {
    return this.adminCampaigns.list(query);
  }

  @Post('campaigns')
  async createCampaign(
    @CurrentUser('userId') actorId: string,
    @Body(new ZodValidationPipe(createCampaignSchema)) input: CreateCampaignInput,
  ): Promise<CampaignRow> {
    const created = await this.adminCampaigns.create(actorId, input);
    await this.audit.record({
      actorId,
      action: 'CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: created.id,
    });
    return created;
  }

  @Patch('campaigns/:id')
  async updateCampaign(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) input: UpdateCampaignInput,
  ): Promise<CampaignRow> {
    const updated = await this.adminCampaigns.update(id, input);
    await this.audit.record({
      actorId,
      action: 'CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: id,
    });
    return updated;
  }

  @Post('campaigns/:id/send')
  async sendCampaign(
    @CurrentUser('userId') actorId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignRow> {
    const sent = await this.adminCampaigns.send(id);
    await this.audit.record({
      actorId,
      action: 'CAMPAIGN_SENT',
      entityType: 'Campaign',
      entityId: id,
      metadata: { recipientCount: sent.recipientCount },
    });
    return sent;
  }

  // ---- Audit log -----------------------------------------------------------

  @Get('audit')
  listAudit(
    @Query(new ZodValidationPipe(auditQuerySchema)) query: AuditQueryInput,
  ): Promise<Paginated<AuditEntryRow>> {
    return this.adminAudit.list(query);
  }
}
