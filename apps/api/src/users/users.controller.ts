import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
import { Paginated } from '@namo/types';
import { adminCreateUserSchema, AdminCreateUserInput, paginationSchema } from '@namo/validation';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PublicUser, toPublicUser } from './user.types';
import { UsersService } from './users.service';

const setActiveSchema = z.object({ isActive: z.boolean() });

/** Admin-only user management. */
@Controller('users')
@Roles('ADMIN')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(paginationSchema)) query: { page: number; pageSize: number },
  ): Promise<Paginated<PublicUser>> {
    return this.users.list(query.page, query.pageSize);
  }

  @Get(':id')
  async get(@Param('id', ParseUUIDPipe) id: string): Promise<PublicUser> {
    return toPublicUser(await this.users.findById(id));
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(adminCreateUserSchema)) dto: AdminCreateUserInput,
    @CurrentUser('userId') actorId: string,
  ): Promise<PublicUser> {
    const user = await this.users.create(dto);
    await this.audit.record({
      actorId,
      action: 'USER_CREATED',
      entityType: 'User',
      entityId: user.id,
      metadata: { role: dto.role },
    });
    return toPublicUser(user);
  }

  @Patch(':id/active')
  async setActive(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(setActiveSchema)) dto: { isActive: boolean },
    @CurrentUser('userId') actorId: string,
  ): Promise<PublicUser> {
    const user = await this.users.setActive(id, dto.isActive);
    await this.audit.record({
      actorId,
      action: dto.isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'User',
      entityId: id,
    });
    return user;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('userId') actorId: string,
  ): Promise<void> {
    await this.users.softDelete(id);
    await this.audit.record({
      actorId,
      action: 'USER_DELETED',
      entityType: 'User',
      entityId: id,
    });
  }
}
