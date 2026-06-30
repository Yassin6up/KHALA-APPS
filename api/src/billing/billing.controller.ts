import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AppContextGuard } from '../core/app-context.guard';
import { AppId, CurrentUser } from '../core/decorators';
import { JwtAuthGuard } from '../core/jwt-auth.guard';
import { BillingService } from './billing.service';

class SubscribeDto {
  @IsString() planCode!: string;
}

@ApiTags('billing')
@ApiSecurity('app-key')
@UseGuards(AppContextGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Get('plans')
  plans(@AppId() appId: string) {
    return this.billing.listPlans(appId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@AppId() appId: string, @CurrentUser() userId: string) {
    return this.billing.mySubscription(appId, userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  subscribe(
    @AppId() appId: string,
    @CurrentUser() userId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.billing.subscribe(appId, userId, dto.planCode);
  }
}
