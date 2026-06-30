import { Controller, Get, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { BillingModule } from './billing/billing.module';
import { CatalogModule } from './catalog/catalog.module';
import { CommunityModule } from './community/community.module';
import { CoachPortalModule } from './coach-portal/coach-portal.module';
import { ConsultModule } from './consult/consult.module';
import { CoreModule } from './core/core.module';
import { LibraryModule } from './library/library.module';
import { MentorModule } from './mentor/mentor.module';
import { ReferralsModule } from './referrals/referrals.module';
import { UsersModule } from './users/users.module';

@ApiTags('health')
@Controller('health')
class HealthController {
  @Get()
  health() {
    return { ok: true, service: 'khala-api', ts: new Date().toISOString() };
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CoreModule,
    AuthModule,
    UsersModule,
    BillingModule,
    CatalogModule,
    LibraryModule,
    CommunityModule,
    CoachPortalModule,
    ConsultModule,
    MentorModule,
    ReferralsModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
