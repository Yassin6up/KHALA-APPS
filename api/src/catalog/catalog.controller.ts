import {
  Body, Controller, Get, NotFoundException, Param, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { PrismaService } from '../core/prisma.service';

@ApiTags('catalog')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('catalog')
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list(
    @AppId() appId: string,
    @Query('section') section?: string,
    @Query('type') type?: string,
  ) {
    return this.prisma.catalogItem.findMany({
      where: {
        appId,
        isPublished: true,
        ...(section ? { section } : {}),
        ...(type ? { type } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  item(@AppId() appId: string, @Param('id') id: string) {
    return this.prisma.catalogItem.findFirst({
      where: { id, appId },
      include: { campSchedule: { orderBy: { dayIndex: 'asc' } } },
    });
  }

  /** Place an order (cash-on-delivery booking). */
  @Post(':id/book')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async bookItem(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Param('id') itemId: string,
    @Body() body: { address: string; phone: string; notes?: string; paymentMethod?: string },
  ) {
    const item = await this.prisma.catalogItem.findFirst({ where: { id: itemId, appId } });
    if (!item) throw new NotFoundException('العنصر غير موجود');

    // Persist address/phone in membership profileJson for pre-fill next time
    await this.prisma.appMembership.updateMany({
      where: { userId, appId },
      data: { profileJson: { address: body.address, phone: body.phone } as any },
    });

    // Create payment record to hold order details
    const payment = await this.prisma.payment.create({
      data: {
        appId,
        userId,
        amountMinor: item.priceMinor,
        currency: item.currency,
        provider: 'manual',
        status: 'pending',
        rawJson: {
          address: body.address,
          phone: body.phone,
          notes: body.notes ?? '',
          paymentMethod: body.paymentMethod ?? 'cod',
          itemTitle: item.titleAr,
        } as any,
      },
    });

    // Create booking
    const booking = await this.prisma.booking.create({
      data: { appId, userId, itemId, status: 'reserved', paymentId: payment.id },
      include: { item: true },
    });

    return { booking, payment };
  }
}
