import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Gift, Heart, ShieldCheck, Truck, ShoppingBag } from 'lucide-react-native';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing } from '../src/theme';

const BASE = 'http://192.168.2.161:4000';

type GiftItem = {
  id: string; titleAr: string; descAr: string | null;
  coverUrl: string | null; priceMinor: number; currency: string;
};

const FEATURES = [
  { icon: Heart, text: 'هدايا مختارة بعناية لكل مناسبة', color: colors.brand },
  { icon: ShieldCheck, text: 'جودة مضمونة وتسليم آمن', color: colors.success },
  { icon: Truck, text: 'توصيل سريع مع تغليف فاخر', color: colors.brand2 },
];

export default function Gifts() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<GiftItem[]>('/catalog?section=gifts')
      .then(setGifts)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function goToGift(id: string) {
    if (!authStore.isLoggedIn()) { router.push('/login'); return; }
    router.push(`/vendor/${id}` as never);
  }

  const priceLabel = (minor: number, currency: string) => {
    const val = (minor / 1000).toFixed(minor % 1000 === 0 ? 0 : 3);
    return `${val} ${currency}`;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>الهدايا الذكية</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIcon}><Gift size={26} color={colors.brand} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>اختر الهدية المثالية</Text>
            <Text style={styles.heroSub}>هدايا مختارة بعناية مع تغليف فاخر وتوصيل سريع</Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresRow}>
          {FEATURES.map((f) => (
            <View key={f.text} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: f.color + '15' }]}>
                <f.icon size={16} color={f.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Gift grid */}
        <Text style={styles.secTitle}>الهدايا المتاحة</Text>

        {loading ? (
          <Text style={styles.empty}>جارٍ التحميل…</Text>
        ) : gifts.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIcon}><Gift size={32} color={colors.textLo} /></View>
            <Text style={styles.emptyTitle}>لا توجد هدايا متاحة حالياً</Text>
            <Text style={styles.emptySub}>سيتم إضافة هدايا قريباً، تابعنا!</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {gifts.map((g) => {
              const coverUri = g.coverUrl?.startsWith('http')
                ? g.coverUrl
                : g.coverUrl
                ? `${BASE}/uploads/${g.coverUrl}`
                : null;
              return (
                <Pressable key={g.id} style={styles.giftCard} onPress={() => goToGift(g.id)}>
                  {coverUri ? (
                    <Image source={{ uri: coverUri }} style={styles.giftImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.giftImg, styles.giftImgPlaceholder]}>
                      <Gift size={30} color={colors.brand} />
                    </View>
                  )}
                  <View style={styles.giftBody}>
                    <Text style={styles.giftTitle} numberOfLines={2}>{g.titleAr}</Text>
                    {g.descAr && (
                      <Text style={styles.giftDesc} numberOfLines={1}>{g.descAr}</Text>
                    )}
                    <View style={styles.giftFoot}>
                      <Pressable style={styles.addBtn} onPress={() => goToGift(g.id)}>
                        <ShoppingBag size={13} color="#fff" />
                      </Pressable>
                      <Text style={styles.giftPrice}>{priceLabel(g.priceMinor, g.currency)}</Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={{ height: 50 }} />
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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  heroBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.pinkSoft, borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(232,72,139,0.15)', marginBottom: spacing.md,
  },
  heroIcon: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(232,72,139,0.2)',
  },
  heroTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi, textAlign: 'right' },
  heroSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMid, textAlign: 'right', marginTop: 2 },
  featuresRow: { gap: 8, marginBottom: spacing.md },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  featureText: { fontFamily: font.medium, fontSize: 13.5, color: colors.textHi, flex: 1, textAlign: 'right' },
  secTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi, textAlign: 'right', marginBottom: spacing.md },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 30 },
  emptyBlock: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyIcon: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  emptyTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  emptySub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  giftCard: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff',
    borderRadius: radii.md, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  giftImg: { width: '100%', height: 118 },
  giftImgPlaceholder: { backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  giftBody: { padding: 10, gap: 6 },
  giftTitle: { fontFamily: font.bold, fontSize: 13, color: colors.textHi, textAlign: 'right' },
  giftDesc: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right' },
  giftFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  addBtn: {
    width: 28, height: 28, borderRadius: 9,
    backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center',
  },
  giftPrice: { fontFamily: font.bold, fontSize: 13.5, color: colors.brand },
});
