import {
  BadRequestException, Body, Controller, Delete, Get,
  NotFoundException, Param, Patch, Post, Put, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma.service';
import { MailService } from '../core/mail.service';
import { CoachGuard, CurrentCoach } from './coach.guard';

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
@ApiTags('coach-portal')
@Controller('coach-portal')
export class CoachPortalController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const { email, password } = body;
    const coach = await this.prisma.coach.findFirst({ where: { email } });
    if (!coach || !coach.passwordHash) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const valid = await bcrypt.compare(password, coach.passwordHash);
    if (!valid) throw new UnauthorizedException('بيانات الدخول غير صحيحة');
    const token = await this.jwt.signAsync(
      { sub: coach.id, role: 'coach', appId: coach.appId },
      { secret: process.env.COACH_JWT_SECRET ?? process.env.JWT_ACCESS_SECRET, expiresIn: '1y' },
    );
    return { token, coach: { id: coach.id, nameAr: coach.nameAr, avatarUrl: coach.avatarUrl, email: coach.email, appId: coach.appId } };
  }

  // ---------------------------------------------------------------------------
  // Me (profile)
  // ---------------------------------------------------------------------------
  @Get('me')
  @UseGuards(CoachGuard)
  async getMe(@CurrentCoach() coachId: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { id: coachId },
      include: {
        availability: true,
        _count: { select: { assets: true, sessions: true } },
      },
    });
    if (!coach) throw new NotFoundException();
    const { passwordHash, ...safe } = coach as any;
    return safe;
  }

  @Patch('me')
  @UseGuards(CoachGuard)
  async updateMe(@CurrentCoach() coachId: string, @Body() body: {
    nameAr?: string; bioAr?: string; avatarUrl?: string; specialtyAr?: string;
    priceSAR?: number; currentPassword?: string; newPassword?: string;
  }) {
    const coach = await this.prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) throw new NotFoundException();

    const data: any = {};
    if (body.nameAr !== undefined) data.nameAr = body.nameAr;
    if (body.bioAr !== undefined) data.bioAr = body.bioAr;
    if (body.avatarUrl !== undefined) data.avatarUrl = body.avatarUrl;
    if (body.specialtyAr !== undefined) data.specialtyAr = body.specialtyAr;
    if (body.priceSAR !== undefined) data.priceSAR = body.priceSAR;

    if (body.newPassword) {
      if (!body.currentPassword) throw new BadRequestException('أدخل كلمة المرور الحالية');
      if (!coach.passwordHash || !(await bcrypt.compare(body.currentPassword, coach.passwordHash))) {
        throw new UnauthorizedException('كلمة المرور الحالية غير صحيحة');
      }
      data.passwordHash = await bcrypt.hash(body.newPassword, 10);
    }

    const updated = await this.prisma.coach.update({ where: { id: coachId }, data });
    const { passwordHash, ...safe } = updated as any;
    return safe;
  }

  // ---------------------------------------------------------------------------
  // Courses (library assets linked to this coach)
  // ---------------------------------------------------------------------------
  @Get('courses')
  @UseGuards(CoachGuard)
  async listCourses(@CurrentCoach() coachId: string) {
    return this.prisma.libraryAsset.findMany({
      where: { coachId },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('courses')
  @UseGuards(CoachGuard)
  async createCourse(@CurrentCoach() coachId: string, @Body() body: {
    titleAr: string; descAr?: string; type: string; url?: string;
    coverUrl?: string; duration?: number; isDownloadable?: boolean;
    requiredEntitlement?: string; priceSAR?: number;
  }) {
    const coach = await this.prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) throw new NotFoundException();
    return this.prisma.libraryAsset.create({
      data: {
        appId: coach.appId,
        coachId,
        titleAr: body.titleAr,
        descAr: body.descAr,
        type: body.type,
        url: body.url,
        coverUrl: body.coverUrl,
        duration: body.duration,
        isDownloadable: body.isDownloadable ?? false,
        requiredEntitlement: body.requiredEntitlement,
        isPublished: false,
      },
    });
  }

  @Patch('courses/:id')
  @UseGuards(CoachGuard)
  async updateCourse(@CurrentCoach() coachId: string, @Param('id') id: string, @Body() body: any) {
    const asset = await this.prisma.libraryAsset.findFirst({ where: { id, coachId } });
    if (!asset) throw new NotFoundException();
    const { id: _id, appId: _app, coachId: _c, createdAt: _d, ...allowed } = body;
    return this.prisma.libraryAsset.update({ where: { id }, data: allowed });
  }

  @Delete('courses/:id')
  @UseGuards(CoachGuard)
  async deleteCourse(@CurrentCoach() coachId: string, @Param('id') id: string) {
    const asset = await this.prisma.libraryAsset.findFirst({ where: { id, coachId } });
    if (!asset) throw new NotFoundException();
    await this.prisma.libraryAsset.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Sessions
  // ---------------------------------------------------------------------------
  @Get('sessions')
  @UseGuards(CoachGuard)
  async listSessions(@CurrentCoach() coachId: string) {
    return this.prisma.consultSession.findMany({
      where: { coachId },
      orderBy: { scheduledAt: 'asc' },
      include: { app: { select: { nameAr: true } } },
    });
  }

  @Patch('sessions/:id')
  @UseGuards(CoachGuard)
  async updateSession(@CurrentCoach() coachId: string, @Param('id') id: string, @Body() body: {
    status?: string; meetingUrl?: string;
  }) {
    const session = await this.prisma.consultSession.findFirst({ where: { id, coachId } });
    if (!session) throw new NotFoundException();
    return this.prisma.consultSession.update({ where: { id }, data: body });
  }

  // ---------------------------------------------------------------------------
  // Availability
  // ---------------------------------------------------------------------------
  @Get('availability')
  @UseGuards(CoachGuard)
  async getAvailability(@CurrentCoach() coachId: string) {
    return this.prisma.coachAvailability.findMany({ where: { coachId }, orderBy: { dayOfWeek: 'asc' } });
  }

  @Put('availability')
  @UseGuards(CoachGuard)
  async setAvailability(@CurrentCoach() coachId: string, @Body() body: { days: { dayOfWeek: number; slots: string[] }[] }) {
    // Upsert all days
    const ops = body.days.map((d) =>
      this.prisma.coachAvailability.upsert({
        where: { coachId_dayOfWeek: { coachId, dayOfWeek: d.dayOfWeek } },
        create: { coachId, dayOfWeek: d.dayOfWeek, slots: d.slots },
        update: { slots: d.slots },
      }),
    );
    await this.prisma.$transaction(ops);
    return this.prisma.coachAvailability.findMany({ where: { coachId }, orderBy: { dayOfWeek: 'asc' } });
  }

  // ---------------------------------------------------------------------------
  // Analytics
  // ---------------------------------------------------------------------------
  @Get('analytics')
  @UseGuards(CoachGuard)
  async analytics(@CurrentCoach() coachId: string) {
    const [totalSessions, upcomingSessions, coursesCount, doneSessions] = await Promise.all([
      this.prisma.consultSession.count({ where: { coachId } }),
      this.prisma.consultSession.count({ where: { coachId, status: { in: ['scheduled', 'confirmed'] }, scheduledAt: { gte: new Date() } } }),
      this.prisma.libraryAsset.count({ where: { coachId } }),
      this.prisma.consultSession.count({ where: { coachId, status: 'done' } }),
    ]);
    const coach = await this.prisma.coach.findUnique({ where: { id: coachId }, select: { priceSAR: true } });
    const estimatedRevenue = (doneSessions * (coach?.priceSAR ?? 0));
    return { totalSessions, upcomingSessions, coursesCount, doneSessions, estimatedRevenue };
  }

  // ---------------------------------------------------------------------------
  // Upload (reuse admin upload endpoint, coach just needs auth)
  // ---------------------------------------------------------------------------
  @Get('payments')
  @UseGuards(CoachGuard)
  async payments(@CurrentCoach() coachId: string) {
    return this.prisma.consultSession.findMany({
      where: { coachId, status: { in: ['confirmed', 'done'] } },
      orderBy: { scheduledAt: 'desc' },
      include: { app: { select: { nameAr: true } } },
    });
  }
}
