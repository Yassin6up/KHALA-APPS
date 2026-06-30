import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';

function makeCode(userId: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seed = userId.slice(-4);
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[seed.charCodeAt(i % seed.length) % chars.length];
  }
  return `QADR-${code}`;
}

@ApiTags('referrals')
@ApiSecurity('app-key')
@ApiBearerAuth()
@UseGuards(AppContextGuard, JwtAuthGuard)
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('my-code')
  async myCode(@AppId() appId: string, @CurrentUser() userId: string) {
    const existing = await this.prisma.referralCode.findFirst({
      where: { appId, userId },
      include: {
        redemptions: { select: { id: true, rewardStatus: true } },
      },
    });
    if (existing) {
      return {
        code: existing.code,
        totalReferrals: existing.redemptions.length,
        paidReferrals: existing.redemptions.filter(
          (r) => r.rewardStatus === 'paid',
        ).length,
      };
    }

    let code = makeCode(userId);
    const collision = await this.prisma.referralCode.findUnique({
      where: { code },
    });
    if (collision) code = `QADR-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const created = await this.prisma.referralCode.create({
      data: { appId, userId, code },
    });
    return { code: created.code, totalReferrals: 0, paidReferrals: 0 };
  }
}
