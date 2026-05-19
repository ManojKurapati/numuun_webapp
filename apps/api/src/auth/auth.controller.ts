import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Post } from '@nestjs/common';
import {
  loginSchema,
  LoginInput,
  refreshSchema,
  RefreshInput,
  registerSchema,
  RegisterInput,
} from '@namo/validation';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PublicUser, toPublicUser } from '../users/user.types';
import { UsersService } from '../users/users.service';
import { AuthResult } from './auth.types';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Public()
  @Post('register')
  register(
    @Body(new ZodValidationPipe(registerSchema)) dto: RegisterInput,
    @Ip() ip: string,
  ): Promise<AuthResult> {
    return this.auth.register(dto, ip);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(
    @Body(new ZodValidationPipe(loginSchema)) dto: LoginInput,
    @Ip() ip: string,
  ): Promise<AuthResult> {
    return this.auth.login(dto, ip);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body(new ZodValidationPipe(refreshSchema)) dto: RefreshInput): Promise<AuthResult> {
    return this.auth.refresh(dto.refreshToken);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(
    @Body(new ZodValidationPipe(refreshSchema)) dto: RefreshInput,
  ): Promise<{ loggedOut: true }> {
    await this.auth.logout(dto.refreshToken);
    return { loggedOut: true };
  }

  /** Current authenticated user's profile. */
  @Get('me')
  async me(@CurrentUser('userId') userId: string): Promise<PublicUser> {
    return toPublicUser(await this.users.findById(userId));
  }
}
