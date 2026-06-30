import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { EntitlementsService } from '../billing/entitlements.service';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';

@ApiTags('library')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('library')
export class LibraryController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
  ) {}

  /** List all assets. URL is omitted for items the caller can't access yet. */
  @Get()
  async list(@AppId() appId: string) {
    const assets = await this.prisma.libraryAsset.findMany({
      where: { appId },
      include: { coach: { select: { id: true, nameAr: true, avatarUrl: true, specialtyAr: true } } },
      orderBy: { createdAt: 'desc' },
    });
    // Strip url from locked assets (they get it on the detail endpoint after entitlement check)
    return assets.map(({ url, ...rest }) => rest);
  }

  /** Detail view — checks entitlement before returning playable URL. */
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async detail(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') id: string,
  ) {
    const asset = await this.prisma.libraryAsset.findFirst({
      where: { id, appId },
      include: { coach: { select: { id: true, nameAr: true, avatarUrl: true, specialtyAr: true } } },
    });
    if (!asset) throw new ForbiddenException('المحتوى غير موجود');

    // Gate premium content behind entitlement check
    const canAccess = !asset.requiredEntitlement
      || await this.entitlements.can(appId, userId, asset.requiredEntitlement as any);

    const progress = await this.prisma.assetProgress.findUnique({
      where: { userId_assetId: { userId, assetId: id } },
    });

    return {
      ...asset,
      url: canAccess ? asset.url : null,  // null = not entitled
      canAccess,
      progress: progress?.progressPct ?? 0,
    };
  }

  @Patch(':id/progress')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProgress(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') assetId: string,
    @Body() body: { pct: number },
  ) {
    return this.prisma.assetProgress.upsert({
      where: { userId_assetId: { userId, assetId } },
      create: { appId, userId, assetId, progressPct: body.pct },
      update: {
        progressPct: body.pct,
        completedAt: body.pct >= 100 ? new Date() : null,
      },
    });
  }
}
