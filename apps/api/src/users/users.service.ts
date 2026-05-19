import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Paginated, UserRole } from '@namo/types';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { PublicUser, toPublicUser } from './user.types';

const BCRYPT_ROUNDS = 12;

export interface CreateUserParams {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
}

/** Owns the user lifecycle: creation, lookup, credentials and admin management. */
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(params: CreateUserParams): Promise<User> {
    const email = params.email.toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw AppException.conflict('EMAIL_IN_USE', 'An account with this email already exists.');
    }
    const passwordHash = await bcrypt.hash(params.password, BCRYPT_ROUNDS);
    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: params.fullName,
        phone: params.phone ?? null,
        role: params.role,
      },
    });
  }

  /** Look up an active user by email, including the password hash (auth use only). */
  async findActiveByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    if (!user) {
      throw AppException.notFound('USER_NOT_FOUND', 'User not found.');
    }
    return user;
  }

  verifyPassword(plain: string, passwordHash: string): Promise<boolean> {
    return bcrypt.compare(plain, passwordHash);
  }

  async list(page: number, pageSize: number): Promise<Paginated<PublicUser>> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where: { deletedAt: null } }),
    ]);
    return { items: items.map(toPublicUser), page, pageSize, total };
  }

  async setActive(id: string, isActive: boolean): Promise<PublicUser> {
    await this.findById(id);
    const updated = await this.prisma.user.update({ where: { id }, data: { isActive } });
    return toPublicUser(updated);
  }

  async softDelete(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
