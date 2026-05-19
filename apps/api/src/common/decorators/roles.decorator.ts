import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@namo/types';

/** Metadata key carrying the roles permitted to access a route. */
export const ROLES_KEY = 'roles';

/** Restrict a route to one or more roles. Enforced by {@link RolesGuard}. */
export const Roles = (...roles: UserRole[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
