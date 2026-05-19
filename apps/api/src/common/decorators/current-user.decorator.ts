import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../auth/auth-user';

/**
 * Injects the authenticated {@link AuthUser}, or one of its properties.
 * Usage: `@CurrentUser() user: AuthUser` or `@CurrentUser('userId') id: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, ctx: ExecutionContext): AuthUser | string => {
    const request = ctx.switchToHttp().getRequest<{ user: AuthUser }>();
    return data ? request.user[data] : request.user;
  },
);
