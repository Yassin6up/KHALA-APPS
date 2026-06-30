import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';
import { AiService } from './ai.service';

@ApiTags('community')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('community')
export class CommunityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  @Get('rooms')
  async listRooms(@AppId() appId: string) {
    const rooms = await this.prisma.room.findMany({
      where: { appId, isActive: true },
      include: { _count: { select: { members: true, messages: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return rooms.map((r) => ({
      id: r.id,
      nameAr: r.nameAr,
      type: r.type,
      imageUrl: r.imageUrl,
      memberCount: r._count.members,
      messageCount: r._count.messages,
    }));
  }

  @Post('rooms/:id/join')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async joinRoom(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') roomId: string,
  ) {
    return this.prisma.roomMember.upsert({
      where: { roomId_userId: { roomId, userId } },
      create: { appId, roomId, userId },
      update: {},
    });
  }

  @Get('rooms/:id/messages')
  async messages(
    @AppId() appId: string,
    @Param('id') roomId: string,
    @Query('limit') limit = '30',
    @Query('before') before?: string,
  ) {
    const msgs = await this.prisma.message.findMany({
      where: {
        roomId,
        ...(before ? { createdAt: { lt: new Date(before) } } : {}),
      },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    const userIds = [...new Set(msgs.map((m) => m.userId))];
    const userBadgesMap = new Map();
    for (const uid of userIds) {
      const ledger = await this.prisma.pointsLedger.findMany({
        where: { appId, userId: uid, reason: { startsWith: 'badge_' } },
      });
      const codes = ledger.map((l) => l.reason.replace('badge_', ''));
      const badges = await this.prisma.badge.findMany({
        where: { appId, code: { in: codes } },
      });
      userBadgesMap.set(uid, badges.slice(0, 3));
    }

    const msgsWithBadges = msgs.map((m) => ({
      ...m,
      user: { ...m.user, badges: userBadgesMap.get(m.userId) || [] },
    }));

    return msgsWithBadges.reverse();
  }

  @Post('rooms/:id/messages')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') roomId: string,
    @Body() body: { text: string },
  ) {
    const msg = await this.prisma.message.create({
      data: { appId, roomId, userId, body: body.text },
      include: {
        user: { select: { id: true, fullName: true, avatarUrl: true } },
      },
    });

    if (body.text.trim().toLowerCase().startsWith('/qader')) {
      // Trigger AI asynchronously so we don't block the request
      this.handleAiCommand(appId, roomId, body.text);
    }

    return msg;
  }

  private async handleAiCommand(appId: string, roomId: string, text: string) {
    try {
      // Ensure there's a system user or AI bot identity. We can use a special user or just inject it.
      // We need a user to represent the AI. Let's find or create a Qader AI user.
      const aiUser = await this.prisma.user.upsert({
        where: { email: 'ai@qader.app' },
        create: {
          email: 'ai@qader.app',
          fullName: 'Qader AI',
          avatarUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&q=80',
        },
        update: {},
      });

      // Provide room context
      const prompt = `أنت مساعد ذكي يسمى "قادر" (Qader). أنت تتحدث باللغة العربية بأسلوب احترافي وودود في تطبيق تطوير وتنمية ذاتية. تم استدعاؤك في غرفة نقاش. أجب بوضوح واختصار.`;
      const aiResponse = await this.aiService.generateResponse(prompt, text);

      await this.prisma.message.create({
        data: {
          appId,
          roomId,
          userId: aiUser.id,
          body: aiResponse,
        },
      });
    } catch (e) {
      console.error('AI Command Error:', e);
    }
  }

  @Get('users/:id/profile')
  async userProfile(@AppId() appId: string, @Param('id') targetUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, fullName: true, avatarUrl: true, createdAt: true },
    });
    if (!user) throw new Error('User not found');

    const roomsCount = await this.prisma.roomMember.count({
      where: { appId, userId: targetUserId },
    });

    const libraryCount = await this.prisma.assetProgress.count({
      where: { appId, userId: targetUserId, progressPct: 100 },
    });

    let allBadges = await this.prisma.badge.findMany({ where: { appId } });

    // Seed badges if none exist
    if (allBadges.length === 0) {
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
          { appId, userId: targetUserId, delta: 100, reason: 'badge_reader' },
          { appId, userId: targetUserId, delta: 100, reason: 'badge_community' },
        ],
      });
      allBadges = await this.prisma.badge.findMany({ where: { appId } });
    }

    const ledgerEntries = await this.prisma.pointsLedger.findMany({
      where: { appId, userId: targetUserId, reason: { startsWith: 'badge_' } },
    });
    const earnedBadgeCodes = new Set(
      ledgerEntries.map((e) => e.reason.replace('badge_', '')),
    );

    const earnedBadges = allBadges.filter((b) => earnedBadgeCodes.has(b.code));

    return {
      user,
      roomsCount,
      libraryCount,
      badges: earnedBadges,
      coverUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1000',
    };
  }
}
