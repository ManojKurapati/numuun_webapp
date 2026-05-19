import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  startAssessmentSchema,
  StartAssessmentInput,
  submitResponsesSchema,
  SubmitResponsesInput,
} from '@namo/validation';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AssessmentDetail } from './assessment.mapper';
import { AssessmentsService } from './assessments.service';

const listQuerySchema = z.object({ childId: z.string().uuid().optional() });

/** Parent-facing assessment flow: start, answer, complete, view score. */
@Controller('assessments')
@Roles('PARENT')
export class AssessmentsController {
  constructor(
    private readonly assessments: AssessmentsService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async start(
    @CurrentUser('userId') parentId: string,
    @Body(new ZodValidationPipe(startAssessmentSchema)) dto: StartAssessmentInput,
  ): Promise<AssessmentDetail> {
    const assessment = await this.assessments.start(parentId, dto);
    await this.audit.record({
      actorId: parentId,
      action: 'ASSESSMENT_STARTED',
      entityType: 'Assessment',
      entityId: assessment.id,
    });
    return assessment;
  }

  @Get()
  list(
    @CurrentUser('userId') parentId: string,
    @Query(new ZodValidationPipe(listQuerySchema)) query: { childId?: string },
  ): Promise<AssessmentDetail[]> {
    return this.assessments.listForParent(parentId, query.childId);
  }

  @Get(':id')
  get(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentDetail> {
    return this.assessments.getOwnedDetail(parentId, id);
  }

  /** Save selected answers. May be called repeatedly to record progress. */
  @Post(':id/responses')
  submitResponses(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(submitResponsesSchema)) dto: SubmitResponsesInput,
  ): Promise<AssessmentDetail> {
    return this.assessments.submitResponses(parentId, id, dto);
  }

  /** Finalise the assessment and return the computed score. */
  @Post(':id/complete')
  async complete(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AssessmentDetail> {
    const result = await this.assessments.complete(parentId, id);
    await this.audit.record({
      actorId: parentId,
      action: 'ASSESSMENT_COMPLETED',
      entityType: 'Assessment',
      entityId: id,
      metadata: { overallZone: result.overallZone, totalScore: result.totalScore },
    });
    return result;
  }
}
