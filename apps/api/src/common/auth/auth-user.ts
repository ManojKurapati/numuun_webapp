import { UserRole } from '@namo/types';

/** The authenticated principal attached to a request by the JWT strategy. */
export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

/** Claims encoded inside the signed access token. */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}
