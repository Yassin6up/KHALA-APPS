import { Injectable } from '@nestjs/common';
import { FEATURES, FeatureKey, PlanAudience } from './billing-types';
import { PrismaService } from '../core/prisma.service';

/** Maps a plan audience to the feature keys it unlocks. */
const PLAN_FEATURES: Record<PlanAudience, FeatureKey[]> = {
  individual: [FEATURES.AI_MENTOR, FEATURES.LIBRARY_PREMIUM, FEATURES.COMMUNITY, FEATURES.CHALLENGES],
  trainer_family: [
    FEATURES.AI_MENTOR,
    FEATURES.LIBRARY_PREMIUM,
    FEATURES.COMMUNITY,
    FEATURES.CHALLENGES,
    FEATURES.CONSULT_1ON1,
  ],
  organization: [
    FEATURES.AI_MENTOR,
    FEATURES.LIBRARY_PREMIUM,
    FEATURES.COMMUNITY,
    FEATURES.CHALLENGES,
    FEATURES.CONSULT_1ON1,
  ],
};

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  featuresForAudience(audience: PlanAudience): FeatureKey[] {
    return PLAN_FEATURES[audience] ?? [];
  }

  async grant(
    appId: string,
    userId: string,
    features: FeatureKey[],
    expiresAt?: Date,
  ) {
    await Promise.all(
      features.map((featureKey) =>
        this.prisma.entitlement.upsert({
          where: { appId_userId_featureKey: { appId, userId, featureKey } },
          create: { appId, userId, featureKey, expiresAt },
          update: { expiresAt, source: 'subscription' },
        }),
      ),
    );
  }

  async can(appId: string, userId: string, featureKey: FeatureKey) {
    const e = await this.prisma.entitlement.findUnique({
      where: { appId_userId_featureKey: { appId, userId, featureKey } },
    });
    if (!e) return false;
    if (e.expiresAt && e.expiresAt < new Date()) return false;
    return true;
  }

  async listForUser(appId: string, userId: string) {
    const rows = await this.prisma.entitlement.findMany({
      where: { appId, userId },
    });
    return rows
      .filter((r) => !r.expiresAt || r.expiresAt > new Date())
      .map((r) => r.featureKey);
  }
}
