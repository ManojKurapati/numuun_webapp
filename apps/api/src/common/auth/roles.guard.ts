import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@namo/types';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppException } from '../errors/app-exception';
import { AuthUser } from './auth-user';

/** Enforces the `@Roles(...)` decorator. Runs after {@link JwtAuthGuard}. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles || roles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!user) {
      throw AppException.unauthorized('UNAUTHENTICATED', 'Authentication is required.');
    }
    if (!roles.includes(user.role)) {
      throw AppException.forbidden('FORBIDDEN', 'You do not have access to this resource.');
    }
    return true;
  }
}
