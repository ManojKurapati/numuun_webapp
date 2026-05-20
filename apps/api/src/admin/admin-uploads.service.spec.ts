/**
 * Lightweight test of the AI extraction simulator and the workflow contract:
 * runExtraction must move an upload into NEEDS_REVIEW and record confidence,
 * extraction payload, and warnings — never auto-publish.
 */
import type { Prisma, QuestionnaireUpload } from '@prisma/client';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';
import { AdminUploadsService } from './admin-uploads.service';

type UploadStub = QuestionnaireUpload & {
  reviewedBy?: { id: string; fullName: string } | null;
  createdBy: { id: string; fullName: string };
};

function makeUpload(over: Partial<UploadStub> = {}): UploadStub {
  return {
    id: 'u-1',
    fileName: 'asq-12-months.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 200_000,
    storageKey: 'seed/u-1.pdf',
    status: 'UPLOADED',
    confidence: null,
    extracted: null,
    warnings: null,
    questionnaireId: null,
    reviewNotes: null,
    reviewedById: null,
    reviewedAt: null,
    reviewedBy: null,
    createdById: 'admin-1',
    createdBy: { id: 'admin-1', fullName: 'Admin' },
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as UploadStub;
}

class FakePrisma {
  state = new Map<string, UploadStub>();
  questionnaireUpload = {
    findUnique: ({ where }: { where: { id: string } }) =>
      Promise.resolve(this.state.get(where.id) ?? null),
    update: ({ where, data }: { where: { id: string }; data: Partial<UploadStub> }) => {
      const current = this.state.get(where.id);
      if (!current) throw new Error('not found');
      const next = { ...current, ...data, updatedAt: new Date() } as UploadStub;
      this.state.set(where.id, next);
      return Promise.resolve(next);
    },
  };
}

describe('AdminUploadsService.runExtraction', () => {
  let service: AdminUploadsService;
  let prisma: FakePrisma;

  beforeEach(async () => {
    prisma = new FakePrisma();
    const module = await Test.createTestingModule({
      providers: [
        AdminUploadsService,
        { provide: PrismaService, useValue: prisma as unknown as PrismaService },
      ],
    }).compile();
    service = module.get(AdminUploadsService);
  });

  it('moves an uploaded file into NEEDS_REVIEW with confidence and warnings', async () => {
    prisma.state.set('u-1', makeUpload());

    const result = await service.runExtraction('u-1');

    expect(result.status).toBe('NEEDS_REVIEW');
    expect(result.confidence).toBeGreaterThan(0);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect((result.warnings as { field: string }[]).length).toBeGreaterThan(0);
    expect(result.extracted).toMatchObject({
      domains: expect.any(Array),
    });
  });

  it('refuses to re-extract a published upload', async () => {
    prisma.state.set(
      'u-1',
      makeUpload({ status: 'PUBLISHED' as QuestionnaireUpload['status'] }) as UploadStub,
    );
    await expect(service.runExtraction('u-1')).rejects.toMatchObject({
      message: expect.stringContaining('already been published'),
    });
  });

  it('throws when the upload does not exist', async () => {
    await expect(service.runExtraction('missing')).rejects.toMatchObject({
      message: expect.stringContaining('Upload not found'),
    });
  });

  // Silence TS unused-symbol warnings for the Prisma type imports.
  it('imports the Prisma input type without runtime side effects', () => {
    const noop: Prisma.QuestionnaireUploadUpdateInput = {};
    expect(noop).toBeDefined();
  });
});
