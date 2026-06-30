import { BadRequestException, Injectable } from '@nestjs/common';
import { PlanAudience } from './billing-types';
import { PrismaService } from '../core/prisma.service';
import { ManualProvider } from './providers/manual.provider';
import { EntitlementsService } from './entitlements.service';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly provider: ManualProvider, // swap for a resolver when a gateway is chosen
  ) {}

  listPlans(appId: string) {
    return this.prisma.plan.findMany({
      where: { appId, isActive: true },
      orderBy: { priceMinor: 'asc' },
    });
  }

  async mySubscription(appId: string, userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { appId, userId, status: { in: ['trialing', 'active'] } },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    const features = await this.entitlements.listForUser(appId, userId);
    return { subscription: sub, features };
  }

  /** Begin a subscription checkout. With the manual provider this activates now. */
  async subscribe(appId: string, userId: string, planCode: string) {
    const plan = await this.prisma.plan.findUnique({
      where: { appId_code: { appId, code: planCode } },
    });
    if (!plan || !plan.isActive) throw new BadRequestException('Unknown plan');

    const checkout = await this.provider.createCheckout({
      appId,
      userId,
      planCode,
      amountMinor: plan.priceMinor,
      currency: plan.currency,
    });

    // Manual provider => activate immediately (dev / comp). Real gateways wait
    // for a webhook before granting entitlements.
    if (checkout.source === 'manual') {
      await this.activate(appId, userId, plan.id, plan.audience as PlanAudience, 'manual', checkout.providerRef);
    }

    return { checkoutUrl: checkout.checkoutUrl, providerRef: checkout.providerRef };
  }

  async activate(
    appId: string,
    userId: string,
    planId: string,
    audience: PlanAudience,
    source: 'apple' | 'google' | 'thawani' | 'manual',
    storeTxnId: string,
  ) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const subscription = await this.prisma.subscription.create({
      data: {
        appId,
        userId,
        planId,
        status: 'active',
        source,
        storeTxnId,
        currentPeriodEnd: periodEnd,
      },
    });

    await this.entitlements.grant(
      appId,
      userId,
      this.entitlements.featuresForAudience(audience),
      periodEnd,
    );
    return subscription;
  }
}
