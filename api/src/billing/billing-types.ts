export type PlanAudience = 'individual' | 'trainer_family' | 'organization';

export const FEATURES = {
  AI_MENTOR: 'ai_mentor',
  CONSULT_1ON1: 'consult_1on1',
  LIBRARY_PREMIUM: 'library_premium',
  COMMUNITY: 'community',
  CHALLENGES: 'challenges',
} as const;
export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];
