import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { colors, font, radii, spacing, type } from '../src/theme';

type Plan = { id: string; code: string; nameAr: string; audience: string; priceMinor: number; currency: string; featuresJson?: string[] };
type SubData = { subscription: { plan: { code: string } } | null };

const PLAN_FEATURES: Record<string, string[]> = {
  individual: ['المرشد الذكي (AI)', 'المكتبة الرقمية الكاملة', 'المجتمع والغرف', 'تحديات ٣٠ و٩٠ يوم'],
  trainer_family: ['كل ميزات الأفراد', 'استشارات ١-على-١', 'أدوات المدربين', 'إدارة الفريق والعائلة'],
  organization: ['كل ميزات المدربين', 'لوحة تحكم المؤسسة', 'تقارير تفصيلية', 'دعم مخصص ٢٤/٧'],
};

const AUDIENCE_ICONS: Record<string, string> = {
  individual: '👤',
  trainer_family: '👨‍👩‍👧‍👦',
  organization: '🏢',
};

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    api<Plan[]>('/billing/plans').then(setPlans).catch(() => []);
    api<SubData>('/billing/me').then((d) => setCurrentCode(d.subscription?.plan?.code ?? null)).catch(() => null);
  }, []);

  async function subscribe(plan: Plan) {
    setSubscribing(plan.id);
    try {
      await api('/billing/subscribe', {
        method: 'POST',
        body: { planCode: plan.code },
      });
      setCurrentCode(plan.code);
    } catch {}
    finally { setSubscribing(null); }
  }

  const isMiddle = (p: Plan) => p.audience === 'trainer_family';

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backArrow}>›</Text>
          </Pressable>
          <Text style={[type.h1, { textAlign: 'right', flex: 1 }]}>الاشتراكات</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <Text style={[type.body, { textAlign: 'right', color: colors.textLo }]}>
            اختر الباقة التي تناسب احتياجاتك وابدأ رحلتك اليوم
          </Text>

          {plans.map((plan) => {
            const isCurrent = currentCode === plan.code;
            const isRecommended = isMiddle(plan);
            const features = PLAN_FEATURES[plan.audience] ?? [];
            const price = (plan.priceMinor / 1000).toFixed(3);

            return (
              <View key={plan.id} style={isRecommended ? styles.recommendedWrap : undefined}>
                {isRecommended && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>⭐ الأكثر شيوعاً</Text>
                  </View>
                )}
                <GlassCard style={[styles.planCard, isCurrent && styles.currentPlan, isRecommended && styles.recommendedPlan]} intensity={isRecommended ? 55 : 35}>
                  {isRecommended && (
                    <LinearGradient
                      colors={['rgba(233,196,106,0.12)', 'transparent']}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View style={styles.planHeader}>
                    <Text style={{ fontSize: 32 }}>{AUDIENCE_ICONS[plan.audience] ?? '📦'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{plan.nameAr}</Text>
                      <View style={styles.priceRow}>
                        <Text style={styles.priceCurrency}>ر.ع</Text>
                        <Text style={[styles.price, isRecommended && { color: colors.gold }]}>{price}</Text>
                      </View>
                      <Text style={styles.priceInterval}>شهرياً</Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  {features.map((f) => (
                    <View key={f} style={styles.featureRow}>
                      <Text style={[styles.featureText, isRecommended && { color: colors.textHi }]}>{f}</Text>
                      <Text style={[styles.checkIcon, isRecommended && { color: colors.gold }]}>✓</Text>
                    </View>
                  ))}

                  <Pressable
                    onPress={() => subscribe(plan)}
                    disabled={isCurrent || subscribing === plan.id}
                    style={[
                      styles.subBtn,
                      isCurrent && styles.subBtnCurrent,
                      isRecommended && !isCurrent && styles.subBtnGold,
                    ]}
                  >
                    {isCurrent ? (
                      <Text style={[styles.subBtnText, { color: colors.brand }]}>✓ مشترك حالياً</Text>
                    ) : subscribing === plan.id ? (
                      <Text style={styles.subBtnText}>جارٍ الاشتراك…</Text>
                    ) : (
                      <Text style={[styles.subBtnText, { color: isRecommended ? '#1a0f00' : '#06121f' }]}>
                        ابدأ التجربة المجانية
                      </Text>
                    )}
                  </Pressable>
                </GlassCard>
              </View>
            );
          })}

          <GlassCard style={styles.faqCard}>
            <Text style={styles.faqTitle}>أسئلة شائعة</Text>
            {[
              { q: 'هل يمكنني إلغاء الاشتراك؟', a: 'نعم، يمكنك الإلغاء في أي وقت.' },
              { q: 'هل التجربة المجانية تحتاج بطاقة بنكية؟', a: 'لا، يمكنك البدء مجاناً بدون أي بيانات مالية.' },
              { q: 'ماذا يحدث بعد انتهاء الاشتراك؟', a: 'تعود إلى النسخة المجانية مع الاحتفاظ بتقدمك.' },
            ].map((f, i) => (
              <View key={i} style={styles.faq}>
                <Text style={styles.faqQ}>{f.q}</Text>
                <Text style={styles.faqA}>{f.a}</Text>
              </View>
            ))}
          </GlassCard>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  backBtn: {},
  backArrow: { fontFamily: font.bold, fontSize: 28, color: colors.textMid, transform: [{ scaleX: -1 }] },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  recommendedWrap: { position: 'relative', paddingTop: 20 },
  recommendedBadge: {
    position: 'absolute', top: 0, alignSelf: 'center', zIndex: 1,
    backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5,
  },
  recommendedText: { fontFamily: font.bold, fontSize: 12, color: '#1a0f00' },
  planCard: { gap: spacing.sm, overflow: 'hidden' },
  currentPlan: { borderColor: colors.brand, borderWidth: 1.5 },
  recommendedPlan: { borderColor: colors.gold, borderWidth: 1.5 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  planName: { fontFamily: font.bold, fontSize: 18, color: colors.textHi, textAlign: 'right' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end', marginTop: 4 },
  price: { fontFamily: font.bold, fontSize: 32, color: colors.brand },
  priceCurrency: { fontFamily: font.medium, fontSize: 14, color: colors.textLo },
  priceInterval: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right' },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.xs },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureText: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'right', flex: 1 },
  checkIcon: { fontFamily: font.bold, fontSize: 16, color: colors.brand, marginLeft: spacing.sm },
  subBtn: { height: 52, borderRadius: radii.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  subBtnCurrent: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.brand },
  subBtnGold: { backgroundColor: colors.gold },
  subBtnText: { fontFamily: font.bold, fontSize: 16 },
  faqCard: { gap: spacing.md },
  faqTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi, textAlign: 'right', marginBottom: spacing.xs },
  faq: { gap: 4 },
  faqQ: { fontFamily: font.medium, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  faqA: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right' },
});
