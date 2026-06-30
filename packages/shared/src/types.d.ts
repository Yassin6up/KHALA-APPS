/** Cross-cutting types shared between backend, app and admin. */
export declare const APPS: {
    readonly QADER: "qader";
    readonly AFIA: "afia";
};
export type AppKey = (typeof APPS)[keyof typeof APPS];
export type AuthProvider = 'apple' | 'google' | 'otp' | 'password';
export type MembershipRole = 'user' | 'trainer' | 'org_admin';
/** Subscription audiences for Qader (3 tiers from the project brief). */
export type PlanAudience = 'individual' | 'trainer_family' | 'organization';
export type PlanInterval = 'month' | 'year';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired';
/** Provider-agnostic billing source (the gateway is decided later). */
export type BillingSource = 'apple' | 'google' | 'thawani' | 'manual';
export type CatalogType = 'workshop' | 'program' | 'camp' | 'course' | 'product';
export type CatalogSection = 'training' | 'self_dev' | 'workshops' | 'camps';
export type LibraryAssetType = 'video' | 'pdf' | 'image' | 'material';
export type ChallengeKind = '30' | '90';
/** Feature keys used by the entitlement layer ("can this user access X?"). */
export declare const FEATURES: {
    readonly AI_MENTOR: "ai_mentor";
    readonly CONSULT_1ON1: "consult_1on1";
    readonly LIBRARY_PREMIUM: "library_premium";
    readonly COMMUNITY: "community";
    readonly CHALLENGES: "challenges";
};
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
