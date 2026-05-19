import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Paginated, QUESTIONNAIRE_STATUSES, QuestionnaireStatus } from '@namo/types';
import {
  createQuestionnaireSchema,
  CreateQuestionnaireInput,
  paginationSchema,
  updateQuestionnaireSchema,
  UpdateQuestionnaireInput,
} from '@namo/validation';
import { z } from 'zod';
import { AuditService } from '../audit/audit.service';
import { ChildrenService } from '../children/children.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { ageInMonths } from '../common/util/age.util';
import { AuthUser } from '../common/auth/auth-user';
import {
  QuestionnaireDetail,
  QuestionnaireSummary,
  toDetail,
  toSummary,
} from './questionnaire.mapper';
import { QuestionnairesService } from './questionnaires.service';

const listQuerySchema = paginationSchema.extend({
  status: z.enum(QUESTIONNAIRE_STATUSES).optional(),
});

@Controller('questionnaires')
export class QuestionnairesController {
  constructor(
    private readonly questionnaires: QuestionnairesService,
    private readonly children: ChildrenService,
    private readonly audit: AuditService,
  ) {}

  // ---- Admin authoring -----------------------------------------------------

  @Post()
  @Roles('ADMIN')
  async create(
    @CurrentUser('userId') adminId: string,
    @Body(new ZodValidationPipe(createQuestionnaireSchema)) dto: CreateQuestionnaireInput,
  ): Promise<QuestionnaireDetail> {
    const created = await this.questionnaires.create(adminId, dto);
    await this.audit.record({
      actorId: adminId,
      action: 'QUESTIONNAIRE_CREATED',
      entityType: 'Questionnaire',
      entityId: created.id,
    });
    return toDetail(created);
  }

  @Get()
  @Roles('ADMIN')
  async list(
    @Query(new ZodValidationPipe(listQuerySchema))
    query: { page: number; pageSize: number; status?: QuestionnaireStatus },
  ): Promise<Paginated<QuestionnaireSummary>> {
    const result = await this.questionnaires.listAll(query.status, query.page, query.pageSize);
    return { ...result, items: result.items.map(toSummary) };
  }

  @Patch(':id')
  @Roles('ADMIN')
  async update(
    @CurrentUser('userId') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateQuestionnaireSchema)) dto: UpdateQuestionnaireInput,
  ): Promise<QuestionnaireDetail> {
    const updated = await this.questionnaires.updateMeta(id, dto);
    await this.audit.record({
      actorId: adminId,
      action: 'QUESTIONNAIRE_UPDATED',
      entityType: 'Questionnaire',
      entityId: id,
    });
    return toDetail(updated);
  }

  @Post(':id/publish')
  @Roles('ADMIN')
  async publish(
    @CurrentUser('userId') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionnaireDetail> {
    const published = await this.questionnaires.publish(id);
    await this.audit.record({
      actorId: adminId,
      action: 'QUESTIONNAIRE_PUBLISHED',
      entityType: 'Questionnaire',
      entityId: id,
    });
    return toDetail(published);
  }

  @Post(':id/archive')
  @Roles('ADMIN')
  async archive(
    @CurrentUser('userId') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionnaireDetail> {
    const archived = await this.questionnaires.archive(id);
    await this.audit.record({
      actorId: adminId,
      action: 'QUESTIONNAIRE_ARCHIVED',
      entityType: 'Questionnaire',
      entityId: id,
    });
    return toDetail(archived);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async remove(
    @CurrentUser('userId') adminId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.questionnaires.softDelete(id);
    await this.audit.record({
      actorId: adminId,
      action: 'QUESTIONNAIRE_DELETED',
      entityType: 'Questionnaire',
      entityId: id,
    });
    return { deleted: true };
  }

  // ---- Parent-facing -------------------------------------------------------

  /** Published questionnaires that apply to the given child's current age. */
  @Get('for-child/:childId')
  @Roles('PARENT')
  async forChild(
    @CurrentUser('userId') parentId: string,
    @Param('childId', ParseUUIDPipe) childId: string,
  ): Promise<QuestionnaireSummary[]> {
    const child = await this.children.getOwned(childId, parentId);
    const matches = await this.questionnaires.listForChildAge(ageInMonths(child.dateOfBirth));
    return matches.map(toSummary);
  }

  /**
   * Full questionnaire with all domains and questions.
   * Admins may view any status; everyone else sees published only.
   */
  @Get(':id')
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<QuestionnaireDetail> {
    const questionnaire =
      user.role === 'ADMIN'
        ? await this.questionnaires.findGraphById(id)
        : await this.questionnaires.findPublishedGraphById(id);
    return toDetail(questionnaire);
  }
}
