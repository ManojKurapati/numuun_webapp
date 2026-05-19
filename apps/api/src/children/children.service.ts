import { Injectable } from '@nestjs/common';
import { Child } from '@prisma/client';
import { Paginated } from '@namo/types';
import { CreateChildInput, UpdateChildInput } from '@namo/validation';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';

/** Manages child profiles. Parent-facing operations are always ownership-scoped. */
@Injectable()
export class ChildrenService {
  constructor(private readonly prisma: PrismaService) {}

  create(parentId: string, input: CreateChildInput): Promise<Child> {
    return this.prisma.child.create({
      data: {
        parentId,
        firstName: input.firstName,
        lastName: input.lastName ?? null,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        gestationalAgeWeeks: input.gestationalAgeWeeks ?? null,
      },
    });
  }

  listForParent(parentId: string): Promise<Child[]> {
    return this.prisma.child.findMany({
      where: { parentId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Fetch a child the given parent owns, or throw 404. */
  async getOwned(childId: string, parentId: string): Promise<Child> {
    const child = await this.prisma.child.findFirst({
      where: { id: childId, parentId, deletedAt: null },
    });
    if (!child) {
      throw AppException.notFound('CHILD_NOT_FOUND', 'Child not found.');
    }
    return child;
  }

  async update(childId: string, parentId: string, input: UpdateChildInput): Promise<Child> {
    await this.getOwned(childId, parentId);
    return this.prisma.child.update({
      where: { id: childId },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        dateOfBirth: input.dateOfBirth,
        gender: input.gender,
        gestationalAgeWeeks: input.gestationalAgeWeeks,
      },
    });
  }

  async softDelete(childId: string, parentId: string): Promise<void> {
    await this.getOwned(childId, parentId);
    await this.prisma.child.update({
      where: { id: childId },
      data: { deletedAt: new Date() },
    });
  }

  /** Admin: list every child across all parents. */
  async listAll(page: number, pageSize: number): Promise<Paginated<Child>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.child.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.child.count({ where: { deletedAt: null } }),
    ]);
    return { items, page, pageSize, total };
  }
}
