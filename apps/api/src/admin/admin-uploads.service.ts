import { Injectable } from '@nestjs/common';
import { Prisma, QuestionnaireUpload } from '@prisma/client';
import { Paginated } from '@namo/types';
import {
  CreateUploadInput,
  ReviewUploadInput,
} from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';

export interface UploadRow {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  status: string;
  confidence: number | null;
  questionnaireId: string | null;
  reviewNotes: string | null;
  reviewedBy: { id: string; fullName: string } | null;
  reviewedAt: string | null;
  createdBy: { id: string; fullName: string };
  createdAt: string;
  updatedAt: string;
  warningCount: number;
}

export interface UploadDetail extends UploadRow {
  extracted: unknown;
  warnings: unknown;
}

const INCLUDE = {
  reviewedBy: { select: { id: true, fullName: true } },
  createdBy: { select: { id: true, fullName: true } },
} satisfies Prisma.QuestionnaireUploadInclude;

type FullUpload = Prisma.QuestionnaireUploadGetPayload<{ include: typeof INCLUDE }>;

/**
 * Simulated AI extraction. In production this would hit a Python service
 * (OCR + LLM). Here we synthesise plausible structured output so the human
 * review workflow can be operated end-to-end against the seeded ASQ-3 data.
 */
function simulateExtraction(fileName: string): {
  confidence: number;
  extracted: Record<string, unknown>;
  warnings: { field: string; message: string }[];
} {
  const ageMatch = fileName.match(/(\d{1,2})[\s_-]*m(?:onth)?/i);
  const ageMonths = ageMatch ? Number(ageMatch[1]) : 12;
  return {
    confidence: 0.83,
    extracted: {
      title: `Extracted draft — ${ageMonths} months`,
      description: 'Auto-drafted from upload. Review before publishing.',
      ageMinMonths: Math.max(0, ageMonths - 1),
      ageMaxMonths: ageMonths + 1,
      domains: [
        { name: 'Communication', code: 'COM', questions: 6 },
        { name: 'Gross Motor', code: 'GM', questions: 6 },
        { name: 'Fine Motor', code: 'FM', questions: 6 },
        { name: 'Problem Solving', code: 'PS', questions: 6 },
        { name: 'Personal-Social', code: 'PSL', questions: 6 },
      ],
    },
    warnings: [
      { field: 'thresholds', message: 'Clinical cutoff scores must be set by an administrator.' },
      { field: 'images', message: 'No images detected — visual aids will need to be added manually.' },
    ],
  };
}

@Injectable()
export class AdminUploadsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(params: {
    status?: string;
    page: number;
    pageSize: number;
  }): Promise<Paginated<UploadRow>> {
    const where: Prisma.QuestionnaireUploadWhereInput = {};
    if (params.status) where.status = params.status as QuestionnaireUpload['status'];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.questionnaireUpload.findMany({
        where,
        include: INCLUDE,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.questionnaireUpload.count({ where }),
    ]);

    return {
      items: items.map((upload) => this.toRow(upload)),
      page: params.page,
      pageSize: params.pageSize,
      total,
    };
  }

  async get(id: string): Promise<UploadDetail> {
    const upload = await this.prisma.questionnaireUpload.findUnique({
      where: { id },
      include: INCLUDE,
    });
    if (!upload) throw AppException.notFound('UPLOAD_NOT_FOUND', 'Upload not found.');
    return {
      ...this.toRow(upload),
      extracted: upload.extracted,
      warnings: upload.warnings,
    };
  }

  async create(actorId: string, input: CreateUploadInput): Promise<UploadRow> {
    const upload = await this.prisma.questionnaireUpload.create({
      data: {
        fileName: input.fileName,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        storageKey: input.storageKey,
        status: 'UPLOADED',
        createdById: actorId,
      },
      include: INCLUDE,
    });
    return this.toRow(upload);
  }

  /** Trigger the (simulated) AI extraction pass for an upload. */
  async runExtraction(id: string): Promise<UploadDetail> {
    const upload = await this.prisma.questionnaireUpload.findUnique({ where: { id } });
    if (!upload) throw AppException.notFound('UPLOAD_NOT_FOUND', 'Upload not found.');
    if (upload.status === 'PUBLISHED') {
      throw AppException.conflict('UPLOAD_ALREADY_PUBLISHED', 'This upload has already been published.');
    }

    const { confidence, extracted, warnings } = simulateExtraction(upload.fileName);
    const updated = await this.prisma.questionnaireUpload.update({
      where: { id },
      data: {
        status: 'NEEDS_REVIEW',
        confidence,
        extracted: extracted as Prisma.InputJsonValue,
        warnings: warnings as unknown as Prisma.InputJsonValue,
      },
      include: INCLUDE,
    });
    return {
      ...this.toRow(updated),
      extracted: updated.extracted,
      warnings: updated.warnings,
    };
  }

  async review(id: string, reviewerId: string, input: ReviewUploadInput): Promise<UploadDetail> {
    const upload = await this.prisma.questionnaireUpload.findUnique({ where: { id } });
    if (!upload) throw AppException.notFound('UPLOAD_NOT_FOUND', 'Upload not found.');

    const updated = await this.prisma.questionnaireUpload.update({
      where: { id },
      data: {
        status: input.status,
        reviewNotes: input.reviewNotes ?? null,
        reviewedById: reviewerId,
        reviewedAt: new Date(),
      },
      include: INCLUDE,
    });
    return {
      ...this.toRow(updated),
      extracted: updated.extracted,
      warnings: updated.warnings,
    };
  }

  private toRow(upload: FullUpload): UploadRow {
    const warningCount = Array.isArray(upload.warnings) ? upload.warnings.length : 0;
    return {
      id: upload.id,
      fileName: upload.fileName,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
      storageKey: upload.storageKey,
      status: upload.status,
      confidence: upload.confidence,
      questionnaireId: upload.questionnaireId,
      reviewNotes: upload.reviewNotes,
      reviewedBy: upload.reviewedBy
        ? { id: upload.reviewedBy.id, fullName: upload.reviewedBy.fullName }
        : null,
      reviewedAt: upload.reviewedAt?.toISOString() ?? null,
      createdBy: { id: upload.createdBy.id, fullName: upload.createdBy.fullName },
      createdAt: upload.createdAt.toISOString(),
      updatedAt: upload.updatedAt.toISOString(),
      warningCount,
    };
  }
}
