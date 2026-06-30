/** Cross-cutting types shared between backend, app and admin. */

export const APPS = {
  QADER: 'qader',
  AFIA: 'afia',
} as const;
export type AppKey = (typeof APPS)[keyof typeof APPS];

export type AuthProvider = 'apple' | 'google' | 'otp' | 'password';

export type MembershipRole = 'user' | 'trainer' | 'org_admin';

/** Subscription audiences for Qader (3 tiers from the project brief). */
export type PlanAudience = 'individual' | 'trainer_family' | 'organization';

export type PlanInterval = 'month' | 'year';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'expired';

/** Provider-agnostic billing source (the gateway is decided later). */
export type BillingSource = 'apple' | 'google' | 'thawani' | 'manual';

export type CatalogType =
  | 'workshop'
  | 'program'
  | 'camp'
  | 'course'
  | 'product';

export type CatalogSection =
  | 'training' // التدريب
  | 'self_dev' // تنمية بشرية
  | 'workshops' // الورش
  | 'camps'; // المعسكرات

export type LibraryAssetType = 'video' | 'pdf' | 'image' | 'material';

export type ChallengeKind = '30' | '90';

/** Feature keys used by the entitlement layer ("can this user access X?"). */
export const FEATURES = {
  AI_MENTOR: 'ai_mentor',
  CONSULT_1ON1: 'consult_1on1',
  LIBRARY_PREMIUM: 'library_premium',
  COMMUNITY: 'community',
  CHALLENGES: 'challenges',
} as const;
export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface PublicUser {
  id: string;
  fullName: string | null;
  avatarUrl: string | null;
  locale: string;
}
