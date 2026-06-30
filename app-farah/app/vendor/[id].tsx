import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Star, Users as UsersIcon, MapPin, Phone, ShoppingBag } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';

type Item = {
  id: string; titleAr: string; descAr: string | null;
  coverUrl: string | null; priceMinor: number; currency: string;
  capacity: number | null; section: string; type: string;
};

export default function VendorDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Item>(`/catalog/${id}`).then(setItem).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  const price = item ? (item.priceMinor / 1000).toFixed(item.priceMinor % 1000 === 0 ? 0 : 3) : '';

  function goOrder() {
    if (!authStore.isLoggedIn()) { router.push('/login'); return; }
    router.push(`/order/${id}` as never);
  }

  if (loading || !item) {
    return (
      <View style={styles.root}>
        <SafeAreaView edges={['top']} style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
        </SafeAreaView>
        <Text style={styles.loadingText}>جارٍ التحميل…</Text>
      </View>
    );
  }

  const coverUri = item.coverUrl?.startsWith('http')
    ? item.coverUrl
    : item.coverUrl
    ? `http://192.168.2.161:4000/uploads/${item.coverUrl}`
    : null;

  return (
    <View style={styles.root}>
      {/* Hero image */}
      <View style={styles.hero}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <LinearGradient colors={[colors.brand, colors.brand2]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtnWhite}>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{item.titleAr}</Text>
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}><Star size={13} color={colors.gold} fill={colors.gold} /><Text style={styles.metaText}>4.8</Text></View>
            {item.capacity && <View style={styles.metaItem}><UsersIcon size={13} color="rgba(255,255,255,0.8)" /><Text style={styles.metaText}>{item.capacity} شخص</Text></View>}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Price card */}
        <View style={styles.priceCard}>
          <View>
            <Text style={styles.priceLabel}>السعر</Text>
            <Text style={styles.price}>{price} <Text style={styles.currency}>{item.currency}</Text></Text>
          </View>
          <Pressable onPress={goOrder} style={styles.orderBtn}>
            <ShoppingBag size={18} color="#fff" />
            <Text style={styles.orderBtnText}>اطلب الآن</Text>
          </Pressable>
        </View>

        {/* Description */}
        {item.descAr && (
          <View style={styles.section}>
            <Text style={styles.secTitle}>عن الخدمة</Text>
            <Text style={styles.desc}>{item.descAr}</Text>
          </View>
        )}

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.secTitle}>تفاصيل الخدمة</Text>
          {[
            { icon: MapPin, label: 'الموقع', val: 'مسقط، سلطنة عُمان' },
            { icon: Phone, label: 'للحجز والاستفسار', val: '+968 9000 0000' },
            { icon: UsersIcon, label: 'الطاقة الاستيعابية', val: item.capacity ? `${item.capacity} شخص` : 'مفتوح' },
          ].map((f) => (
            <View key={f.label} style={styles.featureRow}>
              <Text style={styles.featureVal}>{f.val}</Text>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <View style={styles.featureIcon}><f.icon size={16} color={colors.brand} /></View>
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky CTA */}
      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <View style={styles.ctaInner}>
          <View>
            <Text style={styles.ctaPrice}>{price} {item.currency}</Text>
            <Text style={styles.ctaLabel}>السعر الإجمالي</Text>
          </View>
          <Pressable onPress={goOrder} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>احجز الآن</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 260, justifyContent: 'flex-end' },
  nav: { position: 'absolute', top: 0, left: 0, right: 0, padding: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  backBtnWhite: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { padding: spacing.lg, gap: 8 },
  heroTitle: { fontFamily: font.bold, fontSize: 24, color: '#fff', textAlign: 'right' },
  heroMeta: { flexDirection: 'row', gap: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: font.medium, fontSize: 13, color: 'rgba(255,255,255,0.9)' },
  loadingText: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', marginTop: 80 },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  priceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  priceLabel: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right' },
  price: { fontFamily: font.bold, fontSize: 26, color: colors.brand, textAlign: 'right' },
  currency: { fontFamily: font.regular, fontSize: 14, color: colors.textMid },
  orderBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: radii.pill,
    paddingHorizontal: 22, height: 48,
  },
  orderBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
  section: { marginBottom: spacing.lg },
  secTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right', marginBottom: spacing.sm },
  desc: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'right', lineHeight: 24 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 10, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  featureVal: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  featureLabel: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, flex: 1, textAlign: 'right' },
  featureIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  cta: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  ctaInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: spacing.md },
  ctaPrice: { fontFamily: font.bold, fontSize: 20, color: colors.brand, textAlign: 'right' },
  ctaLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right' },
  ctaBtn: { backgroundColor: colors.brand, borderRadius: radii.pill, paddingHorizontal: 32, height: 50, alignItems: 'center', justifyContent: 'center' },
  ctaBtnText: { fontFamily: font.bold, fontSize: 16, color: '#fff' },
});
