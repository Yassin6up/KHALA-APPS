import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import {
  BillingProvider,
  CheckoutResult,
  NormalizedSubscriptionEvent,
} from '../billing-provider.interface';

/**
 * Default no-gateway provider used until a real gateway is wired.
 * Marks subscriptions active immediately (useful for dev + manual/comp grants).
 */
@Injectable()
export class ManualProvider extends BillingProvider {
  readonly source = 'manual' as const;

  async createCheckout(args: {
    appId: string;
    userId: string;
    planCode: string;
    amountMinor: number;
    currency: string;
  }): Promise<CheckoutResult> {
    void args;
    return { checkoutUrl: null, providerRef: `manual_${nanoid(10)}`, source: 'manual' };
  }

  async parseWebhook(): Promise<{
    eventId: string;
    event: NormalizedSubscriptionEvent | null;
  }> {
    return { eventId: nanoid(), event: null };
  }
}
