import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { LoginInput, RegisterInput } from '@namo/validation';
import { AuditService } from '../audit/audit.service';
import { AppException } from '../common/errors/app-exception';
import { toPublicUser } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { AuthResult } from './auth.types';
import { TokenService } from './token.service';

/** Orchestrates registration, login, token refresh and logout. */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly tokens: TokenService,
    private readonly audit: AuditService,
  ) {}

  /** Self-service registration. Always creates a PARENT account. */
  async register(input: RegisterInput, ip?: string): Promise<AuthResult> {
    const user = await this.users.create({ ...input, role: 'PARENT' });
    await this.audit.record({
      actorId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.id,
      ipAddress: ip,
    });
    return this.buildResult(user);
  }

  async login(input: LoginInput, ip?: string): Promise<AuthResult> {
    const user = await this.users.findActiveByEmail(input.email);
    const passwordOk = user
      ? await this.users.verifyPassword(input.password, user.passwordHash)
      : false;
    if (!user || !user.isActive || !passwordOk) {
      throw AppException.unauthorized('INVALID_CREDENTIALS', 'Email or password is incorrect.');
    }
    await this.audit.record({
      actorId: user.id,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress: ip,
    });
    return this.buildResult(user);
  }

  async refresh(refreshToken: string): Promise<AuthResult> {
    const rotated = await this.tokens.rotateRefreshToken(refreshToken);
    const user = await this.users.findById(rotated.userId);
    if (!user.isActive) {
      throw AppException.unauthorized('ACCOUNT_INACTIVE', 'This account is no longer active.');
    }
    return this.buildResult(user, rotated.refreshToken);
  }

  async logout(refreshToken: string): Promise<void> {
    await this.tokens.revokeRefreshToken(refreshToken);
  }

  private async buildResult(user: User, refreshToken?: string): Promise<AuthResult> {
    return {
      user: toPublicUser(user),
      accessToken: this.tokens.signAccessToken(user),
      refreshToken: refreshToken ?? (await this.tokens.issueRefreshToken(user.id)),
      tokenType: 'Bearer',
      expiresIn: this.tokens.accessTokenTtlSeconds,
    };
  }
}
