import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Check, Crown, Sparkles } from 'lucide-react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing } from '../src/theme';

type Plan = {
  id: string; code: string; nameAr: string; priceMinor: number; currency: string;
  interval: string; audience: string; featuresJson: string[] | null;
};

const FEATURE_LABEL: Record<string, string> = {
  ai_designer: 'مصمم المناسبات بالذكاء الاصطناعي',
  unlimited_events: 'مناسبات بلا حدود',
  premium_invitations: 'دعوات رقمية فاخرة',
  memory_universe: 'عالم الذكريات الكامل',
  smart_gifts: 'الهدايا الذكية',
  priority_vendors: 'أولوية حجز المورّدين',
  live_streaming: 'بث مباشر للمناسبات',
  concierge: 'خدمة كونسيرج خاصة',
  vendor_listing: 'إدراج خدماتك في السوق',
  bookings: 'إدارة الحجوزات',
  analytics: 'تحليلات وإحصائيات',
  featured_placement: 'ظهور مميّز',
};

export default function Subscription() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    api<Plan[]>('/billing/plans')
      .then((p) => {
        setPlans(p);
        setSelected(p.find((x) => x.interval === 'year')?.code ?? p[0]?.code ?? null);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function subscribe() {
    if (!selected) return;
    if (!authStore.isLoggedIn()) { router.push('/login'); return; }
    setSubscribing(true);
    try {
      await api('/billing/subscribe', { method: 'POST', body: { planCode: selected } });
      Alert.alert('مبروك!', 'تم تفعيل اشتراكك بنجاح', [{ text: 'رائع', onPress: () => router.back() }]);
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally {
      setSubscribing(false);
    }
  }

  const price = (p: Plan) => (p.priceMinor / 1000).toFixed(p.priceMinor % 1000 === 0 ? 0 : 3);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>العضوية</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <Pressable style={styles.hero}>
          <LinearGradient colors={[colors.gold, colors.brand]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.crown}><Crown size={28} color="#fff" /></View>
          <Text style={styles.heroTitle}>افتح كل إمكانات فرح</Text>
          <Text style={styles.heroSub}>ذكاء اصطناعي ومناسبات بلا حدود وذكريات تدوم</Text>
        </Pressable>

        {loading ? (
          <Text style={styles.empty}>جارٍ تحميل الباقات…</Text>
        ) : (
          <View style={{ gap: 12, marginTop: spacing.lg }}>
            {plans.map((p) => {
              const active = selected === p.code;
              const isYear = p.interval === 'year';
              return (
                <Pressable key={p.code} onPress={() => setSelected(p.code)}
                  style={[styles.plan, active && styles.planActive]}>
                  {isYear && (
                    <View style={styles.bestBadge}>
                      <Sparkles size={10} color="#fff" />
                      <Text style={styles.bestText}>الأفضل قيمة</Text>
                    </View>
                  )}
                  <View style={styles.planHead}>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <Check size={12} color="#fff" />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planName}>{p.nameAr}</Text>
                      <Text style={styles.planPrice}>
                        {price(p)}{' '}
                        <Text style={styles.planCur}>{p.currency} / {p.interval === 'year' ? 'سنة' : 'شهر'}</Text>
                      </Text>
                    </View>
                  </View>
                  {!!p.featuresJson?.length && (
                    <View style={styles.features}>
                      {p.featuresJson.slice(0, 5).map((f) => (
                        <View key={f} style={styles.featRow}>
                          <Text style={styles.featText}>{FEATURE_LABEL[f] ?? f}</Text>
                          <View style={styles.featCheck}><Check size={11} color={colors.brand} /></View>
                        </View>
                      ))}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 16 }} />
        <PrimaryButton label={subscribing ? 'جارٍ التفعيل…' : 'اشترك الآن'} variant="gold" onPress={subscribe} loading={subscribing} />
        <Text style={styles.terms}>يمكنك إلغاء الاشتراك في أي وقت. تطبّق الشروط والأحكام.</Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder,
  },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  hero: {
    borderRadius: radii.lg, padding: spacing.lg,
    alignItems: 'center', gap: 6, overflow: 'hidden', marginBottom: spacing.sm,
  },
  crown: {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  heroTitle: { fontFamily: font.bold, fontSize: 22, color: '#fff', textAlign: 'center' },
  heroSub: { fontFamily: font.regular, fontSize: 13, color: 'rgba(255,255,255,0.92)', textAlign: 'center', lineHeight: 20 },
  plan: {
    backgroundColor: '#fff', borderRadius: radii.md,
    padding: spacing.md, borderWidth: 1.5, borderColor: colors.glassBorder,
  },
  planActive: { borderColor: colors.brand },
  bestBadge: {
    position: 'absolute', top: -1, left: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: colors.brand,
    borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  bestText: { fontFamily: font.bold, fontSize: 10.5, color: '#fff' },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 6 },
  radio: {
    width: 22, height: 22, borderRadius: 22,
    borderWidth: 1.5, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  planName: { fontFamily: font.bold, fontSize: 15.5, color: colors.textHi, textAlign: 'right' },
  planPrice: { fontFamily: font.bold, fontSize: 19, color: colors.brand, textAlign: 'right', marginTop: 2 },
  planCur: { fontFamily: font.regular, fontSize: 12.5, color: colors.textLo },
  features: { gap: 7, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  featRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  featText: { fontFamily: font.regular, fontSize: 13, color: colors.textMid, textAlign: 'right' },
  featCheck: {
    width: 18, height: 18, borderRadius: 18,
    backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center',
  },
  terms: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'center', marginTop: spacing.md },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 40 },
});
