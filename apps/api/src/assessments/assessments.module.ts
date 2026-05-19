import { Module } from '@nestjs/common';
import { ChildrenModule } from '../children/children.module';
import { QuestionnairesModule } from '../questionnaires/questionnaires.module';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';

@Module({
  imports: [ChildrenModule, QuestionnairesModule],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
  exports: [AssessmentsService],
})
export class AssessmentsModule {}
