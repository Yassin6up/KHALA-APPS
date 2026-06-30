import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { EntitlementsService } from './entitlements.service';
import { ManualProvider } from './providers/manual.provider';

@Module({
  controllers: [BillingController],
  providers: [BillingService, EntitlementsService, ManualProvider],
  exports: [BillingService, EntitlementsService],
})
export class BillingModule {}
