import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRole } from '@namo/types';
import { AccessTokenPayload, AuthUser } from '../common/auth/auth-user';
import { Env } from '../config/env.validation';

/** Verifies the bearer access token and produces the request's {@link AuthUser}. */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<Env, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_ACCESS_SECRET', { infer: true }),
    });
  }

  validate(payload: AccessTokenPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as UserRole,
    };
  }
}
