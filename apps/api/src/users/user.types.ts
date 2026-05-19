import { User } from '@prisma/client';
import { UserRole } from '@namo/types';

/** A user record safe to return over the API — never includes the password hash. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

/** Strip secrets and internal fields from a User row. */
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role as UserRole,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}
