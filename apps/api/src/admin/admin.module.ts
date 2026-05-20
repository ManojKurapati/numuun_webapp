import { Module } from '@nestjs/common';
import { AssessmentsModule } from '../assessments/assessments.module';
import { ChildrenModule } from '../children/children.module';
import { AdminAuditService } from './admin-audit.service';
import { AdminCampaignsService } from './admin-campaigns.service';
import { AdminChildrenService } from './admin-children.service';
import { AdminInterventionsService } from './admin-interventions.service';
import { AdminReferralsService } from './admin-referrals.service';
import { AdminUploadsService } from './admin-uploads.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [ChildrenModule, AssessmentsModule],
  controllers: [AdminController],
  providers: [
    AdminService,
    AdminChildrenService,
    AdminReferralsService,
    AdminInterventionsService,
    AdminUploadsService,
    AdminCampaignsService,
    AdminAuditService,
  ],
})
export class AdminModule {}
