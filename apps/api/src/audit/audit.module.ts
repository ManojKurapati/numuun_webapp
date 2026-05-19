import { Global, Module } from '@nestjs/common';
import { AuditService } from './audit.service';

/** Global so any feature module can record audit events. */
@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
