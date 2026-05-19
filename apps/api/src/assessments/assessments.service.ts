import { Injectable } from '@nestjs/common';
import { Assessment, Prisma } from '@prisma/client';
import {
  QuestionnaireScoringError,
  ResponseInput,
  ResponseValue,
  scoreAssessment,
} from '@namo/questionnaire-engine';
import { Paginated } from '@namo/types';
import { StartAssessmentInput, SubmitResponsesInput } from '@namo/validation';
import { ChildrenService } from '../children/children.service';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { ageInMonths } from '../common/util/age.util';
import { QuestionnaireWithGraph, toScoringDefinition } from '../questionnaires/questionnaire.mapper';
import { QuestionnairesService } from '../questionnaires/questionnaires.service';
import { AssessmentDetail, AssessmentWithResult, toDetail } from './assessment.mapper';

const RESULT_INCLUDE = {
  responses: true,
  domainScores: { include: { domain: true } },
} satisfies Prisma.AssessmentInclude;

/**
 * Drives the assessment lifecycle: start → answer questions → score.
 * Scoring is delegated to the deterministic questionnaire-engine.
 */
@Injectable()
export class AssessmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly children: ChildrenService,
    private readonly questionnaires: QuestionnairesService,
  ) {}

  /** Start (or resume) an assessment of a child against a published questionnaire. */
  async start(parentId: string, input: StartAssessmentInput): Promise<AssessmentDetail> {
    const child = await this.children.getOwned(input.childId, parentId);
    const questionnaire = await this.questionnaires.findPublishedGraphById(input.questionnaireId);
    const childAgeMonths = ageInMonths(child.dateOfBirth);

    if (
      childAgeMonths < questionnaire.ageMinMonths ||
      childAgeMonths > questionnaire.ageMaxMonths
    ) {
      throw AppException.badRequest(
        'QUESTIONNAIRE_AGE_MISMATCH',
        `This questionnaire applies to ages ${questionnaire.ageMinMonths}–${questionnaire.ageMaxMonths} months, ` +
          `but the child is ${childAgeMonths} months old.`,
      );
    }

    // Resume an in-progress assessment for the same child + questionnaire if one exists.
    const existing = await this.prisma.assessment.findFirst({
      where: {
        childId: child.id,
        questionnaireId: questionnaire.id,
        status: 'IN_PROGRESS',
        deletedAt: null,
      },
      include: RESULT_INCLUDE,
    });
    if (existing) {
      return toDetail(existing, this.countQuestions(questionnaire));
    }

    const created = await this.prisma.assessment.create({
      data: {
        childId: child.id,
        questionnaireId: questionnaire.id,
        startedById: parentId,
        childAgeMonths,
      },
      include: RESULT_INCLUDE,
    });
    return toDetail(created, this.countQuestions(questionnaire));
  }

  /** Save answers for an in-progress assessment. Answers are upserted per question. */
  async submitResponses(
    parentId: string,
    assessmentId: string,
    input: SubmitResponsesInput,
  ): Promise<AssessmentDetail> {
    const assessment = await this.findOwned(parentId, assessmentId);
    if (assessment.status !== 'IN_PROGRESS') {
      throw AppException.conflict(
        'ASSESSMENT_NOT_EDITABLE',
        'This assessment has already been completed.',
      );
    }

    const questionnaire = await this.questionnaires.findGraphById(assessment.questionnaireId);
    const validQuestionIds = this.questionIdSet(questionnaire);
    for (const response of input.responses) {
      if (!validQuestionIds.has(response.questionId)) {
        throw AppException.badRequest(
          'INVALID_QUESTION',
          `Question "${response.questionId}" does not belong to this questionnaire.`,
        );
      }
    }

    await this.prisma.$transaction(
      input.responses.map((response) =>
        this.prisma.response.upsert({
          where: {
            assessmentId_questionId: { assessmentId, questionId: response.questionId },
          },
          create: { assessmentId, questionId: response.questionId, value: response.value },
          update: { value: response.value },
        }),
      ),
    );

    return toDetail(await this.loadResult(assessmentId), validQuestionIds.size);
  }

  /** Finalise an assessment: validate completeness, score it, and persist the result. */
  async complete(parentId: string, assessmentId: string): Promise<AssessmentDetail> {
    const assessment = await this.findOwned(parentId, assessmentId);
    if (assessment.status !== 'IN_PROGRESS') {
      throw AppException.conflict(
        'ASSESSMENT_ALREADY_COMPLETED',
        'This assessment has already been completed.',
      );
    }

    const questionnaire = await this.questionnaires.findGraphById(assessment.questionnaireId);
    const totalQuestions = this.countQuestions(questionnaire);
    const responses = await this.prisma.response.findMany({ where: { assessmentId } });
    if (responses.length < totalQuestions) {
      throw AppException.badRequest(
        'ASSESSMENT_INCOMPLETE',
        `All ${totalQuestions} questions must be answered before completing; ` +
          `${responses.length} have been answered.`,
      );
    }

    const definition = toScoringDefinition(questionnaire);
    const responseInputs: ResponseInput[] = responses.map((response) => ({
      questionId: response.questionId,
      value: response.value as ResponseValue,
    }));

    let score;
    try {
      score = scoreAssessment(definition, responseInputs);
    } catch (error) {
      if (error instanceof QuestionnaireScoringError) {
        throw AppException.unprocessable('SCORING_FAILED', error.message, { reason: error.code });
      }
      throw error;
    }

    const completed = await this.prisma.$transaction(async (tx) => {
      await tx.domainScore.createMany({
        data: score.domainScores.map((domainScore) => ({
          assessmentId,
          domainId: domainScore.domainId,
          rawScore: domainScore.rawScore,
          maxScore: domainScore.maxScore,
          zone: domainScore.zone,
        })),
      });
      return tx.assessment.update({
        where: { id: assessmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          totalScore: score.totalScore,
          totalMaxScore: score.totalMaxScore,
          overallZone: score.overallZone,
        },
        include: RESULT_INCLUDE,
      });
    });

    return toDetail(completed, totalQuestions);
  }

  /** Full detail of one assessment the parent owns. */
  async getOwnedDetail(parentId: string, assessmentId: string): Promise<AssessmentDetail> {
    const assessment = await this.findOwned(parentId, assessmentId);
    const questionnaire = await this.questionnaires.findGraphById(assessment.questionnaireId);
    return toDetail(await this.loadResult(assessmentId), this.countQuestions(questionnaire));
  }

  /** All assessments started by the parent, optionally filtered to one child. */
  async listForParent(parentId: string, childId?: string): Promise<AssessmentDetail[]> {
    if (childId) {
      await this.children.getOwned(childId, parentId);
    }
    const assessments = await this.prisma.assessment.findMany({
      where: { deletedAt: null, child: { parentId }, ...(childId ? { childId } : {}) },
      include: RESULT_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      assessments.map(async (assessment) => {
        const questionnaire = await this.questionnaires.findGraphById(assessment.questionnaireId);
        return toDetail(assessment, this.countQuestions(questionnaire));
      }),
    );
  }

  /** Admin: paginated list of every assessment across all families. */
  async listAll(page: number, pageSize: number): Promise<Paginated<AssessmentWithResult>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.assessment.findMany({
        where: { deletedAt: null },
        include: RESULT_INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.assessment.count({ where: { deletedAt: null } }),
    ]);
    return { items, page, pageSize, total };
  }

  private async findOwned(parentId: string, assessmentId: string): Promise<Assessment> {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, deletedAt: null, child: { parentId } },
    });
    if (!assessment) {
      throw AppException.notFound('ASSESSMENT_NOT_FOUND', 'Assessment not found.');
    }
    return assessment;
  }

  private async loadResult(assessmentId: string): Promise<AssessmentWithResult> {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: RESULT_INCLUDE,
    });
    if (!assessment) {
      throw AppException.notFound('ASSESSMENT_NOT_FOUND', 'Assessment not found.');
    }
    return assessment;
  }

  private countQuestions(questionnaire: QuestionnaireWithGraph): number {
    return questionnaire.domains.reduce((sum, domain) => sum + domain.questions.length, 0);
  }

  private questionIdSet(questionnaire: QuestionnaireWithGraph): Set<string> {
    const ids = new Set<string>();
    for (const domain of questionnaire.domains) {
      for (const question of domain.questions) {
        ids.add(question.id);
      }
    }
    return ids;
  }
}
