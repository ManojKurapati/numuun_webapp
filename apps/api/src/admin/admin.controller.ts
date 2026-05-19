import { Controller, Get, Query } from '@nestjs/common';
import { Paginated } from '@namo/types';
import { paginationSchema } from '@namo/validation';
import { AssessmentSummary, toSummary } from '../assessments/assessment.mapper';
import { AssessmentsService } from '../assessments/assessments.service';
import { PublicChild, toPublicChild } from '../children/child.types';
import { ChildrenService } from '../children/children.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminService, PlatformOverview } from './admin.service';

/** Read-only oversight endpoints for administrators. */
@Controller('admin')
@Roles('ADMIN')
export class AdminController {
  constructor(
    private readonly admin: AdminService,
    private readonly children: ChildrenService,
    private readonly assessments: AssessmentsService,
  ) {}

  /** Aggregate platform metrics for the admin dashboard. */
  @Get('stats')
  overview(): Promise<PlatformOverview> {
    return this.admin.overview();
  }

  /** Every child profile across all families. */
  @Get('children')
  async listChildren(
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; pageSize: number },
  ): Promise<Paginated<PublicChild>> {
    const result = await this.children.listAll(query.page, query.pageSize);
    return { ...result, items: result.items.map(toPublicChild) };
  }

  /** Every assessment across the platform. */
  @Get('assessments')
  async listAssessments(
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; pageSize: number },
  ): Promise<Paginated<AssessmentSummary>> {
    const result = await this.assessments.listAll(query.page, query.pageSize);
    return { ...result, items: result.items.map(toSummary) };
  }
}
