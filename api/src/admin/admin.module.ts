import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAuthController } from './admin-auth.controller';
import { AdminService } from './admin.service';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [AdminController, AdminAuthController],
  providers: [AdminService, AdminGuard],
})
export class AdminModule {}
