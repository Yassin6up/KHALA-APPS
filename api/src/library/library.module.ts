import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { LibraryController } from './library.controller';

@Module({ imports: [BillingModule], controllers: [LibraryController] })
export class LibraryModule {}
