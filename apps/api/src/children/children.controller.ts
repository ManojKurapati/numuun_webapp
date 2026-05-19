import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  createChildSchema,
  CreateChildInput,
  updateChildSchema,
  UpdateChildInput,
} from '@namo/validation';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { PublicChild, toPublicChild } from './child.types';
import { ChildrenService } from './children.service';

/** Parent-facing child profile management. Every action is ownership-scoped. */
@Controller('children')
@Roles('PARENT')
export class ChildrenController {
  constructor(
    private readonly children: ChildrenService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  async create(
    @CurrentUser('userId') parentId: string,
    @Body(new ZodValidationPipe(createChildSchema)) dto: CreateChildInput,
  ): Promise<PublicChild> {
    const child = await this.children.create(parentId, dto);
    await this.audit.record({
      actorId: parentId,
      action: 'CHILD_CREATED',
      entityType: 'Child',
      entityId: child.id,
    });
    return toPublicChild(child);
  }

  @Get()
  async list(@CurrentUser('userId') parentId: string): Promise<PublicChild[]> {
    const children = await this.children.listForParent(parentId);
    return children.map(toPublicChild);
  }

  @Get(':id')
  async get(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicChild> {
    return toPublicChild(await this.children.getOwned(id, parentId));
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateChildSchema)) dto: UpdateChildInput,
  ): Promise<PublicChild> {
    const child = await this.children.update(id, parentId, dto);
    await this.audit.record({
      actorId: parentId,
      action: 'CHILD_UPDATED',
      entityType: 'Child',
      entityId: id,
    });
    return toPublicChild(child);
  }

  @Delete(':id')
  async remove(
    @CurrentUser('userId') parentId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ deleted: true }> {
    await this.children.softDelete(id, parentId);
    await this.audit.record({
      actorId: parentId,
      action: 'CHILD_DELETED',
      entityType: 'Child',
      entityId: id,
    });
    return { deleted: true };
  }
}
