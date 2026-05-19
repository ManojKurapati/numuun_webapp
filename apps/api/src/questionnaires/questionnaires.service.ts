import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Paginated, QuestionnaireStatus } from '@namo/types';
import { CreateQuestionnaireInput, UpdateQuestionnaireInput } from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { QuestionnaireWithGraph } from './questionnaire.mapper';

const GRAPH_INCLUDE = {
  domains: { include: { questions: true } },
} satisfies Prisma.QuestionnaireInclude;

/** Owns the questionnaire content lifecycle: authoring, versioning, publishing. */
@Injectable()
export class QuestionnairesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Create a new questionnaire version in DRAFT state with its full graph. */
  create(adminId: string, input: CreateQuestionnaireInput): Promise<QuestionnaireWithGraph> {
    return this.prisma.questionnaire.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        ageMinMonths: input.ageMinMonths,
        ageMaxMonths: input.ageMaxMonths,
        yesScore: input.responseScores?.YES ?? null,
        sometimesScore: input.responseScores?.SOMETIMES ?? null,
        notYetScore: input.responseScores?.NOT_YET ?? null,
        createdById: adminId,
        domains: {
          create: input.domains.map((domain) => ({
            name: domain.name,
            code: domain.code,
            order: domain.order,
            delayThreshold: domain.delayThreshold,
            monitoringThreshold: domain.monitoringThreshold,
            questions: {
              create: domain.questions.map((question) => ({
                text: question.text,
                helpText: question.helpText ?? null,
                order: question.order,
              })),
            },
          })),
        },
      },
      include: GRAPH_INCLUDE,
    });
  }

  /** Load a questionnaire with its full graph, or throw 404. */
  async findGraphById(id: string): Promise<QuestionnaireWithGraph> {
    const questionnaire = await this.prisma.questionnaire.findFirst({
      where: { id, deletedAt: null },
      include: GRAPH_INCLUDE,
    });
    if (!questionnaire) {
      throw AppException.notFound('QUESTIONNAIRE_NOT_FOUND', 'Questionnaire not found.');
    }
    return questionnaire;
  }

  /** Load a questionnaire that must be PUBLISHED — used for parent-facing views. */
  async findPublishedGraphById(id: string): Promise<QuestionnaireWithGraph> {
    const questionnaire = await this.findGraphById(id);
    if (questionnaire.status !== 'PUBLISHED') {
      throw AppException.notFound('QUESTIONNAIRE_NOT_FOUND', 'Questionnaire not found.');
    }
    return questionnaire;
  }

  async listAll(
    status: QuestionnaireStatus | undefined,
    page: number,
    pageSize: number,
  ): Promise<Paginated<QuestionnaireWithGraph>> {
    const where: Prisma.QuestionnaireWhereInput = { deletedAt: null, ...(status ? { status } : {}) };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.questionnaire.findMany({
        where,
        include: GRAPH_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.questionnaire.count({ where }),
    ]);
    return { items, page, pageSize, total };
  }

  /** Published questionnaires whose age band covers the given child age. */
  listForChildAge(ageMonths: number): Promise<QuestionnaireWithGraph[]> {
    return this.prisma.questionnaire.findMany({
      where: {
        deletedAt: null,
        status: 'PUBLISHED',
        ageMinMonths: { lte: ageMonths },
        ageMaxMonths: { gte: ageMonths },
      },
      include: GRAPH_INCLUDE,
      orderBy: { ageMinMonths: 'asc' },
    });
  }

  /** Update questionnaire metadata. Only permitted while still a DRAFT. */
  async updateMeta(id: string, input: UpdateQuestionnaireInput): Promise<QuestionnaireWithGraph> {
    const questionnaire = await this.findGraphById(id);
    if (questionnaire.status !== 'DRAFT') {
      throw AppException.conflict(
        'QUESTIONNAIRE_NOT_EDITABLE',
        'Only draft questionnaires can be edited.',
      );
    }
    const next = { ...questionnaire, ...input };
    if (next.ageMinMonths > next.ageMaxMonths) {
      throw AppException.badRequest(
        'INVALID_AGE_BAND',
        'ageMinMonths must be less than or equal to ageMaxMonths.',
      );
    }
    return this.prisma.questionnaire.update({
      where: { id },
      data: input,
      include: GRAPH_INCLUDE,
    });
  }

  async publish(id: string): Promise<QuestionnaireWithGraph> {
    const questionnaire = await this.findGraphById(id);
    if (questionnaire.status !== 'DRAFT') {
      throw AppException.conflict(
        'QUESTIONNAIRE_NOT_PUBLISHABLE',
        'Only draft questionnaires can be published.',
      );
    }
    return this.prisma.questionnaire.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
      include: GRAPH_INCLUDE,
    });
  }

  async archive(id: string): Promise<QuestionnaireWithGraph> {
    const questionnaire = await this.findGraphById(id);
    if (questionnaire.status !== 'PUBLISHED') {
      throw AppException.conflict(
        'QUESTIONNAIRE_NOT_ARCHIVABLE',
        'Only published questionnaires can be archived.',
      );
    }
    return this.prisma.questionnaire.update({
      where: { id },
      data: { status: 'ARCHIVED' },
      include: GRAPH_INCLUDE,
    });
  }

  async softDelete(id: string): Promise<void> {
    const questionnaire = await this.findGraphById(id);
    if (questionnaire.status !== 'DRAFT') {
      throw AppException.conflict(
        'QUESTIONNAIRE_NOT_DELETABLE',
        'Only draft questionnaires can be deleted.',
      );
    }
    await this.prisma.questionnaire.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
