/**
 * Provider-agnostic billing contract. The concrete gateway (RevenueCat for
 * Apple/Google IAP, or Thawani) is chosen later — the rest of the app only
 * depends on this interface, so swapping providers touches one file.
 */
export interface CheckoutResult {
  /** URL to redirect/open, or null for native store flows handled client-side. */
  checkoutUrl: string | null;
  /** Opaque reference we store on the Payment row. */
  providerRef: string;
  source: 'apple' | 'google' | 'thawani' | 'manual';
}

export interface NormalizedSubscriptionEvent {
  userId: string;
  planCode: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
  source: 'apple' | 'google' | 'thawani' | 'manual';
  storeTxnId?: string;
  currentPeriodEnd?: Date;
}

export abstract class BillingProvider {
  abstract readonly source: 'apple' | 'google' | 'thawani' | 'manual';

  /** Start a checkout for a plan (web/Thawani) — native IAP returns null url. */
  abstract createCheckout(args: {
    appId: string;
    userId: string;
    planCode: string;
    amountMinor: number;
    currency: string;
  }): Promise<CheckoutResult>;

  /** Parse + verify a provider webhook into a normalized event (or null to skip). */
  abstract parseWebhook(
    headers: Record<string, string>,
    body: unknown,
  ): Promise<{ eventId: string; event: NormalizedSubscriptionEvent | null }>;
}
