import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppContextGuard } from './app-context.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MailService } from './mail.service';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_ACCESS_SECRET || 'change-me-access',
    }),
  ],
  providers: [PrismaService, AppContextGuard, JwtAuthGuard, MailService],
  exports: [PrismaService, AppContextGuard, JwtAuthGuard, JwtModule, MailService],
})
export class CoreModule {}
