import { PublicUser } from '../users/user.types';

/** Result of any successful authentication exchange. */
export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  /** Access-token lifetime in seconds. */
  expiresIn: number;
}
