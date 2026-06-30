import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId } from '../core/decorators';
import { PrismaService } from '../core/prisma.service';

@ApiTags('coaches')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('coaches')
export class CoachesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@AppId() appId: string) {
    return this.prisma.coach.findMany({
      where: { appId, isActive: true },
      select: {
        id: true, nameAr: true, bioAr: true,
        avatarUrl: true, specialtyAr: true,
        _count: { select: { assets: true, sessions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  @Get(':id')
  async detail(@AppId() appId: string, @Param('id') id: string) {
    const coach = await this.prisma.coach.findFirst({
      where: { id, appId, isActive: true },
      include: {
        assets: {
          select: { id: true, titleAr: true, type: true, duration: true, coverUrl: true },
          where: { isPublished: true },
        },
      },
    });
    if (!coach) return null;
    return coach;
  }
}
