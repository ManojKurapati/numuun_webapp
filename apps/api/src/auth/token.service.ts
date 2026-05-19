import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { UserRole } from '@namo/types';
import { AccessTokenPayload } from '../common/auth/auth-user';
import { AppException } from '../common/errors/app-exception';
import { PrismaService } from '../common/prisma/prisma.service';
import { Env } from '../config/env.validation';

const DAY_MS = 86_400_000;
const REFRESH_TOKEN_BYTES = 48;

/**
 * Issues access tokens (signed JWTs) and refresh tokens (opaque random strings).
 * Refresh tokens are stored only as SHA-256 hashes and are rotated on every use.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get accessTokenTtlSeconds(): number {
    return this.config.get('JWT_ACCESS_TTL', { infer: true });
  }

  signAccessToken(user: Pick<User, 'id' | 'email' | 'role'>): string {
    const payload: AccessTokenPayload = {
      sub: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    return this.jwt.sign(payload);
  }

  async issueRefreshToken(userId: string): Promise<string> {
    const raw = this.randomToken();
    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hash(raw), expiresAt: this.refreshExpiry() },
    });
    return raw;
  }

  /** Validate a refresh token, revoke it, and issue a replacement. */
  async rotateRefreshToken(raw: string): Promise<{ userId: string; refreshToken: string }> {
    const current = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(raw) },
    });
    if (!current || current.revokedAt || current.expiresAt.getTime() < Date.now()) {
      throw AppException.unauthorized(
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or has expired.',
      );
    }
    const replacement = this.randomToken();
    await this.prisma.$transaction([
      this.prisma.refreshToken.update({
        where: { id: current.id },
        data: { revokedAt: new Date() },
      }),
      this.prisma.refreshToken.create({
        data: {
          userId: current.userId,
          tokenHash: this.hash(replacement),
          expiresAt: this.refreshExpiry(),
        },
      }),
    ]);
    return { userId: current.userId, refreshToken: replacement };
  }

  async revokeRefreshToken(raw: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hash(raw), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private randomToken(): string {
    return randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
  }

  private hash(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private refreshExpiry(): Date {
    const days = this.config.get('JWT_REFRESH_TTL_DAYS', { infer: true });
    return new Date(Date.now() + days * DAY_MS);
  }
}
