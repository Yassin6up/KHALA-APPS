import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';

@ApiTags('users')
@ApiSecurity('app-key')
@ApiBearerAuth()
@UseGuards(AppContextGuard, JwtAuthGuard)
@Controller('me')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async me(@AppId() appId: string, @CurrentUser() userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const membership = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId, appId } },
    });
    const pointsAgg = await this.prisma.pointsLedger.aggregate({
      where: { appId, userId },
      _sum: { delta: true },
    });
    const sub = await this.prisma.subscription.findFirst({
      where: { appId, userId, status: { in: ['active', 'trialing'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return {
      user,
      membership,
      points: pointsAgg._sum.delta ?? 0,
      subscription: sub ?? null,
    };
  }

  @Patch()
  async updateMe(
    @CurrentUser() userId: string,
    @Body() body: { fullName?: string; avatarUrl?: string },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.fullName !== undefined ? { fullName: body.fullName } : {}),
        ...(body.avatarUrl !== undefined ? { avatarUrl: body.avatarUrl } : {}),
      },
      select: { id: true, fullName: true, avatarUrl: true, phone: true, email: true },
    });
  }

  @Delete()
  @HttpCode(200)
  async deleteMe(@CurrentUser() userId: string) {
    // Revoke all sessions first
    await this.prisma.session.deleteMany({ where: { userId } });
    // Soft-delete: anonymise user data
    const anon = `deleted_${userId.slice(0, 8)}`;
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone: null,
        email: null,
        fullName: anon,
        avatarUrl: null,
      },
    });
    return { ok: true };
  }

  @Get('achievements')
  async achievements(@AppId() appId: string, @CurrentUser() userId: string) {
    const pointsAgg = await this.prisma.pointsLedger.aggregate({
      where: { appId, userId },
      _sum: { delta: true },
    });

    let badges = await this.prisma.badge.findMany({ where: { appId } });

    // Seed badges if none exist (similar to community profile)
    if (badges.length === 0) {
      await this.prisma.badge.createMany({
        data: [
          { appId, code: 'reader', nameAr: 'القارئ النهم', iconUrl: 'badge_reader_1782686991783.png' },
          { appId, code: 'streak', nameAr: 'الشعلة', iconUrl: 'badge_streak_1782687005574.png' },
          { appId, code: 'community', nameAr: 'نجم المجتمع', iconUrl: 'badge_community_1782687015110.png' },
        ],
        skipDuplicates: true,
      });
      // Award the user some badges for demo
      await this.prisma.pointsLedger.createMany({
        data: [
          { appId, userId, delta: 100, reason: 'badge_reader' },
          { appId, userId, delta: 100, reason: 'badge_streak' },
        ],
      });
      badges = await this.prisma.badge.findMany({ where: { appId } });
    }

    const ledgerEntries = await this.prisma.pointsLedger.findMany({
      where: { appId, userId, reason: { startsWith: 'badge_' } },
    });
    const earnedBadgeCodes = new Set(
      ledgerEntries.map((e) => e.reason.replace('badge_', '')),
    );

    const challengesDone = await this.prisma.dailyTask.count({
      where: { appId, userId, status: 'done' },
    });

    return {
      points: pointsAgg._sum.delta ?? 0,
      tasksCompleted: challengesDone,
      badges: badges.map((b) => ({
        ...b,
        earned: earnedBadgeCodes.has(b.code),
      })),
    };
  }

  @Patch('password')
  async changePassword(
    @CurrentUser() userId: string,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    if (!body.newPassword || body.newPassword.length < 6) {
      throw new BadRequestException('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
    }
    const identity = await this.prisma.userIdentity.findFirst({
      where: { userId, provider: 'password' },
    });
    if (!identity) {
      throw new BadRequestException('لا يوجد كلمة مرور مرتبطة بهذا الحساب. استخدم تسجيل الدخول بالبريد الإلكتروني أولاً.');
    }
    if (identity.secretHash) {
      const valid = await bcrypt.compare(body.currentPassword ?? '', identity.secretHash);
      if (!valid) throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
    }
    const secretHash = await bcrypt.hash(body.newPassword, 10);
    await this.prisma.userIdentity.update({ where: { id: identity.id }, data: { secretHash } });
    return { ok: true };
  }

  /** Join the current app (idempotent) — creates a per-app membership. */
  @Post('join')
  join(@AppId() appId: string, @CurrentUser() userId: string) {
    return this.prisma.appMembership.upsert({
      where: { userId_appId: { userId, appId } },
      create: { userId, appId, role: 'user' },
      update: {},
    });
  }

  /** My order history across all bookings for this app. */
  @Get('bookings')
  async myBookings(@AppId() appId: string, @CurrentUser() userId: string) {
    const bookings = await this.prisma.booking.findMany({
      where: { appId, userId },
      include: {
        item: { select: { id: true, titleAr: true, descAr: true, coverUrl: true, priceMinor: true, currency: true, section: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      bookings.map(async (b) => {
        const payment = b.paymentId
          ? await this.prisma.payment.findUnique({ where: { id: b.paymentId } })
          : null;
        return { ...b, payment };
      }),
    );
  }

  /** Profile stats: event count, memory count, order count, earned badge count. */
  @Get('stats')
  async stats(@AppId() appId: string, @CurrentUser() userId: string) {
    const [orders, earnedBadgeEntries] = await Promise.all([
      this.prisma.booking.count({ where: { appId, userId } }),
      this.prisma.pointsLedger.findMany({
        where: { appId, userId, reason: { startsWith: 'badge_' } },
        select: { reason: true },
      }),
    ]);

    // Community messages the user sent = activity proxy for "events"
    const messages = await this.prisma.message.count({ where: { appId, userId } });

    return {
      orders,
      messages,
      earnedBadges: new Set(earnedBadgeEntries.map((e) => e.reason)).size,
    };
  }

  /** Saved shipping address from last order. */
  @Get('saved-address')
  async savedAddress(@AppId() appId: string, @CurrentUser() userId: string) {
    const m = await this.prisma.appMembership.findUnique({
      where: { userId_appId: { userId, appId } },
      select: { profileJson: true },
    });
    return m?.profileJson ?? {};
  }

  /** In-app notifications for the current user. */
  @Get('notifications')
  async notifications(@AppId() appId: string, @CurrentUser() userId: string) {
    return this.prisma.notification.findMany({
      where: { appId, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /** Mark a single notification as read. */
  @Patch('notifications/:id/read')
  async markNotifRead(
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    // Verify ownership
    const notif = await this.prisma.notification.findFirst({ where: { id, userId } });
    if (!notif) return { ok: false };
    await this.prisma.notification.update({ where: { id }, data: { isRead: true } });
    return { ok: true };
  }

  /** Mark all notifications as read. */
  @Patch('notifications/read-all')
  async markAllRead(@AppId() appId: string, @CurrentUser() userId: string) {
    await this.prisma.notification.updateMany({ where: { appId, userId, isRead: false }, data: { isRead: true } });
    return { ok: true };
  }
}
