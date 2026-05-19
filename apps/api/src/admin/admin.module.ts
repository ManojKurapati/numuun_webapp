import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ChildrenModule } from '../children/children.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ChildrenModule, AssessmentsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
