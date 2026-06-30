import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../core/prisma.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly adminService: AdminService,
  ) {}

  private async getAppId(appKey: string): Promise<string> {
    const app = await this.prisma.app.findUnique({ where: { key: appKey } });
    if (!app) throw new BadRequestException(`App '${appKey}' not found`);
    return app.id;
  }

  // ---------------------------------------------------------------------------
  // Multi-app overview
  // ---------------------------------------------------------------------------
  @Get('apps')
  getApps() {
    return this.adminService.appsWithStats();
  }

  // ---------------------------------------------------------------------------
  // Stats (single app)
  // ---------------------------------------------------------------------------
  @Get('stats')
  async getStats(@Query('appKey') appKey = 'qader') {
    const appId = await this.getAppId(appKey);

    const [users, rooms, messages, assets, subscriptions, activeSubs, plans] =
      await Promise.all([
        this.prisma.appMembership.count({ where: { appId } }),
        this.prisma.room.count({ where: { appId } }),
        this.prisma.message.count({ where: { appId } }),
        this.prisma.libraryAsset.count({ where: { appId } }),
        this.prisma.subscription.count({ where: { appId } }),
        this.prisma.subscription.count({
          where: { appId, status: { in: ['active', 'trialing'] } },
        }),
        this.prisma.plan.count({ where: { appId } }),
      ]);

    // 6-month signup trend for the chart
    const since = new Date();
    since.setMonth(since.getMonth() - 5);
    since.setDate(1);
    const recentMembers = await this.prisma.appMembership.findMany({
      where: { appId, joinedAt: { gte: since } },
      select: { joinedAt: true },
    });
    const trend: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const value = recentMembers.filter(
        (m) => `${m.joinedAt.getFullYear()}-${m.joinedAt.getMonth()}` === key,
      ).length;
      trend.push({ label: d.toLocaleDateString('ar', { month: 'short' }), value });
    }

    return { users, rooms, messages, assets, subscriptions, activeSubs, plans, trend };
  }

  // ---------------------------------------------------------------------------
  // Rooms
  // ---------------------------------------------------------------------------
  @Get('rooms')
  async getRooms(@Query('appKey') appKey = 'qader') {
    const appId = await this.getAppId(appKey);
    return this.prisma.room.findMany({
      where: { appId },
      include: { _count: { select: { members: true, messages: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('rooms')
  async createRoom(
    @Body()
    body: { appKey?: string; nameAr: string; type?: string; imageUrl?: string; isActive?: boolean },
  ) {
    const appId = await this.getAppId(body.appKey ?? 'qader');
    return this.prisma.room.create({
      data: {
        appId,
        nameAr: body.nameAr,
        type: body.type ?? 'public',
        imageUrl: body.imageUrl,
        isActive: body.isActive ?? true,
      },
    });
  }

  @Patch('rooms/:id')
  async updateRoom(
    @Param('id') id: string,
    @Body() body: { nameAr?: string; type?: string; imageUrl?: string; isActive?: boolean },
  ) {
    return this.prisma.room.update({ where: { id }, data: body });
  }

  @Delete('rooms/:id')
  @HttpCode(HttpStatus.OK)
  async deleteRoom(@Param('id') id: string) {
    await this.prisma.room.update({ where: { id }, data: { isActive: false } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------
  @Get('library')
  async getLibrary(@Query('appKey') appKey = 'qader') {
    const appId = await this.getAppId(appKey);
    return this.prisma.libraryAsset.findMany({
      where: { appId },
      include: { coach: { select: { id: true, nameAr: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('library')
  async createLibraryAsset(
    @Body()
    body: {
      appKey?: string; type: string; titleAr: string; descAr?: string;
      url: string; coverUrl?: string; duration?: number;
      requiredEntitlement?: string; isDownloadable?: boolean; coachId?: string;
    },
  ) {
    const appId = await this.getAppId(body.appKey ?? 'qader');
    return this.prisma.libraryAsset.create({
      data: {
        appId, type: body.type, titleAr: body.titleAr, descAr: body.descAr,
        url: body.url, coverUrl: body.coverUrl, duration: body.duration,
        requiredEntitlement: body.requiredEntitlement ?? null,
        isDownloadable: body.isDownloadable ?? false,
        coachId: body.coachId ?? null,
      },
    });
  }

  @Patch('library/:id')
  async updateLibraryAsset(
    @Param('id') id: string,
    @Body()
    body: {
      type?: string; titleAr?: string; descAr?: string; url?: string;
      coverUrl?: string; duration?: number; requiredEntitlement?: string;
      isDownloadable?: boolean; coachId?: string | null;
    },
  ) {
    return this.prisma.libraryAsset.update({ where: { id }, data: body });
  }

  @Delete('library/:id')
  @HttpCode(HttpStatus.OK)
  async deleteLibraryAsset(@Param('id') id: string) {
    await this.prisma.libraryAsset.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
  @Get('users')
  async getUsers(
    @Query('appKey') appKey = 'qader',
    @Query('search') search = '',
    @Query('page') page = '1',
  ) {
    const appId = await this.getAppId(appKey);
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = 20;
    const skip = (pageNum - 1) * pageSize;

    const where = {
      appId,
      user: search
        ? { OR: [{ fullName: { contains: search } }, { email: { contains: search } }] }
        : undefined,
    };

    const [memberships, total] = await Promise.all([
      this.prisma.appMembership.findMany({
        where,
        include: {
          user: {
            include: {
              subscriptions: { where: { appId }, orderBy: { createdAt: 'desc' }, take: 1 },
            },
          },
        },
        skip,
        take: pageSize,
        orderBy: { joinedAt: 'desc' },
      }),
      this.prisma.appMembership.count({ where }),
    ]);

    return {
      data: memberships.map((m) => ({
        ...m.user,
        role: m.role,
        joinedAt: m.joinedAt,
        subscription: m.user.subscriptions[0] ?? null,
      })),
      total,
      page: pageNum,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() body: { fullName?: string; email?: string },
  ) {
    return this.prisma.user.update({ where: { id }, data: body });
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string) {
    await this.prisma.session.deleteMany({ where: { userId: id } });
    await this.prisma.userIdentity.deleteMany({ where: { userId: id } });
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Subscriptions
  // ---------------------------------------------------------------------------
  @Get('subscriptions')
  async getSubscriptions(@Query('appKey') appKey = 'qader') {
    const appId = await this.getAppId(appKey);
    return this.prisma.subscription.findMany({
      where: { appId },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        plan: {
          select: { id: true, nameAr: true, code: true, interval: true, priceMinor: true, currency: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------------------------------------------------------------------
  // Catalog (marketplace items)
  // ---------------------------------------------------------------------------
  @Get('catalog')
  async getCatalog(@Query('appKey') appKey = 'qader') {
    const appId = await this.getAppId(appKey);
    return this.prisma.catalogItem.findMany({
      where: { appId },
      include: { _count: { select: { bookings: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('catalog')
  async createCatalogItem(
    @Body() body: {
      appKey?: string; type: string; section: string; titleAr: string;
      descAr?: string; coverUrl?: string; priceMinor?: number; capacity?: number;
      isPublished?: boolean;
    },
  ) {
    const appId = await this.getAppId(body.appKey ?? 'qader');
    return this.prisma.catalogItem.create({
      data: {
        appId,
        type: body.type,
        section: body.section,
        titleAr: body.titleAr,
        descAr: body.descAr,
        coverUrl: body.coverUrl,
        priceMinor: body.priceMinor ?? 0,
        capacity: body.capacity,
        isPublished: body.isPublished ?? true,
      },
    });
  }

  @Patch('catalog/:id')
  async updateCatalogItem(
    @Param('id') id: string,
    @Body() body: { titleAr?: string; descAr?: string; coverUrl?: string; priceMinor?: number; isPublished?: boolean },
  ) {
    return this.prisma.catalogItem.update({ where: { id }, data: body });
  }

  @Delete('catalog/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCatalogItem(@Param('id') id: string) {
    await this.prisma.catalogItem.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // Orders
  // ---------------------------------------------------------------------------
  @Get('orders')
  async getOrders(
    @Query('appKey') appKey = 'qader',
    @Query('status') status?: string,
  ) {
    const appId = await this.getAppId(appKey);
    return this.prisma.booking.findMany({
      where: { appId, ...(status ? { status } : {}) },
      include: {
        user: { select: { id: true, fullName: true, email: true, phone: true } },
        item: { select: { id: true, titleAr: true, coverUrl: true, priceMinor: true, currency: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch('orders/:id')
  async updateOrder(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const booking = await this.prisma.booking.update({
      where: { id },
      data: { status: body.status },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        item: { select: { id: true, titleAr: true } },
      },
    });
    // If marking paid, also update the payment
    if (body.status === 'paid' && booking) {
      await this.prisma.payment.updateMany({
        where: { id: (booking as any).paymentId ?? '' },
        data: { status: 'paid' },
      });
    }
    return booking;
  }

  // ---------------------------------------------------------------------------
  // Consult sessions (per-app)
  // ---------------------------------------------------------------------------
  @Get('sessions')
  async listSessions(@Query('appKey') appKey: string, @Query('coachId') coachId?: string, @Query('status') status?: string) {
    const appId = await this.getAppId(appKey);
    return this.prisma.consultSession.findMany({
      where: {
        appId,
        ...(coachId ? { coachId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        coach: { select: { id: true, nameAr: true, avatarUrl: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  @Patch('sessions/:id')
  async updateSession(@Param('id') id: string, @Body() body: { status?: string }) {
    return this.prisma.consultSession.update({ where: { id }, data: body });
  }

  // ---------------------------------------------------------------------------
  // Coaches (per-app)
  // ---------------------------------------------------------------------------
  @Get('coaches')
  async listCoaches(@Query('appKey') appKey: string) {
    const appId = await this.getAppId(appKey);
    return this.prisma.coach.findMany({
      where: { appId },
      include: { _count: { select: { assets: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('coaches')
  async createCoach(@Body() body: {
    appKey: string; nameAr: string; bioAr?: string; avatarUrl?: string;
    specialtyAr?: string; email?: string; password?: string; priceSAR?: number;
  }) {
    const appId = await this.getAppId(body.appKey);
    const passwordHash = body.password ? await bcrypt.hash(body.password, 10) : undefined;
    return this.prisma.coach.create({
      data: {
        appId, nameAr: body.nameAr, bioAr: body.bioAr, avatarUrl: body.avatarUrl,
        specialtyAr: body.specialtyAr, email: body.email, passwordHash, priceSAR: body.priceSAR,
      },
    });
  }

  @Patch('coaches/:id')
  async updateCoach(
    @Param('id') id: string,
    @Body() body: { nameAr?: string; bioAr?: string; avatarUrl?: string; specialtyAr?: string; isActive?: boolean; email?: string; password?: string; priceSAR?: number },
  ) {
    const { password, ...rest } = body as any;
    const data: any = { ...rest };
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    return this.prisma.coach.update({ where: { id }, data });
  }

  @Delete('coaches/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCoach(@Param('id') id: string) {
    // Unlink assets before deleting
    await this.prisma.libraryAsset.updateMany({ where: { coachId: id }, data: { coachId: null } });
    await this.prisma.coach.delete({ where: { id } });
    return { ok: true };
  }

  // ---------------------------------------------------------------------------
  // File upload
  // ---------------------------------------------------------------------------
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const uploadDir = join(process.cwd(), 'uploads');
          if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (_req, file, cb) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new BadRequestException(`File type '${file.mimetype}' not allowed`), false);
      },
      limits: { fileSize: 500 * 1024 * 1024 },
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return { url: `/uploads/${file.filename}` };
  }
}
