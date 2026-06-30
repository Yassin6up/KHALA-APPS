import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { MailService } from '../core/mail.service';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';
import { sessionConfirmedCoachEmail, sessionConfirmedUserEmail } from './email-templates';

function generateMeetingUrl(sessionId: string): string {
  const roomToken = sessionId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  return `https://meet.jit.si/khala-${roomToken}`;
}

@ApiTags('consult')
@ApiSecurity('app-key')
@ApiBearerAuth()
@UseGuards(AppContextGuard, JwtAuthGuard)
@Controller('consult')
export class ConsultController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  /** Book a session with a coach. */
  @Post('book')
  async book(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Body() body: {
      coachId: string;
      scheduledAt: string; // ISO date string
      durationMin?: number;
      notesAr?: string;
    },
  ) {
    if (!body.coachId || !body.scheduledAt) {
      throw new BadRequestException('coachId و scheduledAt مطلوبان');
    }

    const coach = await this.prisma.coach.findFirst({ where: { id: body.coachId, appId } });
    if (!coach || !coach.isActive) throw new NotFoundException('المدرب غير موجود');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const scheduledAt = new Date(body.scheduledAt);
    if (isNaN(scheduledAt.getTime())) throw new BadRequestException('تاريخ غير صالح');
    if (scheduledAt < new Date()) throw new BadRequestException('لا يمكن الحجز في وقت ماضٍ');

    // Create the session first to get the ID for the meeting URL
    const session = await this.prisma.consultSession.create({
      data: {
        appId,
        userId,
        coachId: body.coachId,
        scheduledAt,
        durationMin: body.durationMin ?? 30,
        channel: 'video',
        status: 'scheduled',
        notesAr: body.notesAr ?? null,
        meetingUrl: '', // placeholder, updated next
      },
      include: { coach: true },
    });

    // Generate meeting URL using the session ID
    const meetingUrl = generateMeetingUrl(session.id);
    await this.prisma.consultSession.update({
      where: { id: session.id },
      data: { meetingUrl },
    });

    const userName = user.fullName ?? user.email ?? 'مستخدم';
    const userEmail = user.email ?? '';

    // Create in-app notification for the user
    await this.prisma.notification.create({
      data: {
        appId,
        userId,
        type: 'session',
        titleAr: 'تم تأكيد جلستك',
        bodyAr: `جلستك مع ${coach.nameAr} محجوزة بتاريخ ${scheduledAt.toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' })}`,
        dataJson: { sessionId: session.id, meetingUrl, coachId: body.coachId },
      },
    });

    // Send email to user
    if (userEmail) {
      await this.mail.send(
        userEmail,
        `تأكيد جلستك مع ${coach.nameAr} — KHALA`,
        sessionConfirmedUserEmail({
          userName,
          coachName: coach.nameAr,
          scheduledAt,
          durationMin: body.durationMin ?? 30,
          meetingUrl,
          sessionId: session.id,
        }),
      );
    }

    // Send email to coach
    if (coach.email) {
      await this.mail.send(
        coach.email,
        `جلسة جديدة مع ${userName} — KHALA`,
        sessionConfirmedCoachEmail({
          coachName: coach.nameAr,
          userName,
          userEmail,
          scheduledAt,
          durationMin: body.durationMin ?? 30,
          meetingUrl,
          notesAr: body.notesAr,
        }),
      );
    }

    return { ...session, meetingUrl };
  }

  /** List all sessions for the current user. */
  @Get('my-sessions')
  async mySessions(@AppId() appId: string, @CurrentUser() userId: string) {
    return this.prisma.consultSession.findMany({
      where: { appId, userId },
      include: { coach: { select: { id: true, nameAr: true, avatarUrl: true, specialtyAr: true } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  /** Get a single session (must belong to current user). */
  @Get('sessions/:id')
  async getSession(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    const session = await this.prisma.consultSession.findFirst({
      where: { id, appId, userId },
      include: { coach: { select: { id: true, nameAr: true, avatarUrl: true, specialtyAr: true, bioAr: true } } },
    });
    if (!session) throw new NotFoundException('الجلسة غير موجودة');
    return session;
  }

  /** Cancel a session (user cancellation). */
  @Patch('sessions/:id/cancel')
  async cancelSession(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    const session = await this.prisma.consultSession.findFirst({ where: { id, appId, userId } });
    if (!session) throw new NotFoundException('الجلسة غير موجودة');
    if (session.status === 'done') throw new BadRequestException('لا يمكن إلغاء جلسة منتهية');
    return this.prisma.consultSession.update({ where: { id }, data: { status: 'canceled' } });
  }
}
