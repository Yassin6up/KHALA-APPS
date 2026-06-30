import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CoachGuard } from './coach.guard';
import { CoachPortalController } from './coach-portal.controller';

@Module({
  imports: [JwtModule.register({})],
  controllers: [CoachPortalController],
  providers: [CoachGuard],
})
export class CoachPortalModule {}
