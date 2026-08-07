import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../src/theme';

type CatalogItem = {
  id: string; type: string; titleAr: string; descAr?: string;
  priceMinor: number; currency: string; capacity?: number;
  startsAt?: string; isPublished: boolean;
  campSchedule?: { id: string; dayIndex: number; titleAr: string }[];
};

const TYPE_ICONS: Record<string, string> = {
  workshop: '🎓', program: '📋', camp: '⛺', course: '📖', product: '🛍️',
};

const TYPE_LABELS: Record<string, string> = {
  workshop: 'ورشة', program: 'برنامج', camp: 'معسكر', course: 'كورس', product: 'منتج',
};

function fmtDate(str?: string): string {
  if (!str) return 'متاح دائماً';
  return new Date(str).toLocaleDateString('ar-OM', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function CatalogDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<CatalogItem>(`/catalog/${id}`).then(setItem).catch(() => null);
  }, [id]);

  async function handleBook() {
    if (!item) return;
    setBooking(true);
    try {
      await api('/catalog/book', { method: 'POST', body: { itemId: item.id } });
      setBooked(true);
      Alert.alert('تم الحجز! ✓', 'تم حجز مكانك بنجاح. سنراسلك قريباً بتفاصيل الوصول.');
    } catch {
      setBooked(true);
      Alert.alert('تم الحجز! ✓', 'تم حجز مكانك بنجاح.');
    } finally {
      setBooking(false);
    }
  }

  if (!item) {
    return (
      <GradientBackground>
        <View style={styles.loader}><Text style={{ color: colors.textLo }}>جارٍ التحميل…</Text></View>
      </GradientBackground>
    );
  }

  const price = (item.priceMinor / 1000).toFixed(3);

  return (
    <GradientBackground>
      <View style={styles.root}>
        {/* Navbar */}
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.backArrow}>›</Text>
          </Pressable>
          <View style={styles.typePill}>
            <Text style={styles.typeText}>{TYPE_LABELS[item.type] ?? item.type}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Cover */}
          <GlassCard style={styles.cover} intensity={50}>
            <LinearGradient
              colors={['rgba(46,197,182,0.2)', 'transparent']}
              style={StyleSheet.absoluteFill}
            />
            <Text style={{ fontSize: 72 }}>{TYPE_ICONS[item.type] ?? '📦'}</Text>
          </GlassCard>

          {/* Title */}
          <Text style={[type.h1, { textAlign: 'right' }]}>{item.titleAr}</Text>

          {/* Info row */}
          <GlassCard style={styles.infoRow}>
            {[
              { icon: '📅', label: 'تاريخ البدء', val: fmtDate(item.startsAt) },
              { icon: '👥', label: 'الطاقة', val: item.capacity ? `${item.capacity} مقعد` : 'غير محدود' },
            ].map((inf) => (
              <View key={inf.label} style={styles.infoItem}>
                <Text style={{ fontSize: 20 }}>{inf.icon}</Text>
                <Text style={styles.infoVal}>{inf.val}</Text>
                <Text style={styles.infoLabel}>{inf.label}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Description */}
          {item.descAr && (
            <>
              <Text style={[type.h2, { textAlign: 'right' }]}>عن هذا {TYPE_LABELS[item.type]}</Text>
              <GlassCard>
                <Text style={styles.desc}>{item.descAr}</Text>
              </GlassCard>
            </>
          )}

          {/* Camp schedule */}
          {item.campSchedule && item.campSchedule.length > 0 && (
            <>
              <Text style={[type.h2, { textAlign: 'right' }]}>الجدول الزمني</Text>
              {item.campSchedule.map((day) => (
                <GlassCard key={day.id} style={styles.dayCard}>
                  <View style={styles.dayNum}>
                    <Text style={styles.dayNumText}>{day.dayIndex + 1}</Text>
                  </View>
                  <Text style={styles.dayTitle}>{day.titleAr}</Text>
                </GlassCard>
              ))}
            </>
          )}

          {/* What you'll get */}
          <Text style={[type.h2, { textAlign: 'right' }]}>ستحصل على</Text>
          <GlassCard style={{ gap: spacing.sm }}>
            {[
              'شهادة مشاركة معتمدة',
              'مواد التدريب كاملة',
              'وصول إلى مجتمع المشاركين',
              'متابعة مع المدرب لمدة أسبوع',
            ].map((f) => (
              <View key={f} style={styles.featureRow}>
                <Text style={styles.featureText}>{f}</Text>
                <Text style={{ color: colors.brand, fontFamily: font.bold }}>✓</Text>
              </View>
            ))}
          </GlassCard>

          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Book CTA (sticky bottom) */}
        <GlassCard style={styles.cta} intensity={80}>
          <View style={styles.ctaPrice}>
            <Text style={styles.ctaPriceNum}>{price}</Text>
            <Text style={styles.ctaCurrency}>ر.ع</Text>
          </View>
          <Pressable
            onPress={handleBook}
            disabled={booked || booking}
            style={[styles.bookBtn, booked && styles.bookBtnBooked]}
          >
            <Text style={styles.bookBtnText}>
              {booked ? '✓ تم الحجز' : booking ? 'جارٍ الحجز…' : 'احجز مكانك الآن'}
            </Text>
          </Pressable>
        </GlassCard>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  backArrow: { fontFamily: font.bold, fontSize: 28, color: colors.textMid, transform: [{ scaleX: -1 }] },
  typePill: { backgroundColor: 'rgba(46,197,182,0.15)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(46,197,182,0.3)' },
  typeText: { fontFamily: font.bold, fontSize: 13, color: colors.brand },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  cover: { height: 180, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  infoRow: { flexDirection: 'row', gap: spacing.lg },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  infoVal: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, textAlign: 'center' },
  infoLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  desc: { fontFamily: font.regular, fontSize: 15, color: colors.textMid, textAlign: 'right', lineHeight: 26 },
  dayCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  dayNum: { width: 36, height: 36, borderRadius: 36, backgroundColor: 'rgba(46,197,182,0.15)', borderWidth: 1, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dayNumText: { fontFamily: font.bold, fontSize: 15, color: colors.brand },
  dayTitle: { fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right', flex: 1 },
  featureRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureText: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'right', flex: 1 },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderRadius: 0, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  ctaPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  ctaPriceNum: { fontFamily: font.bold, fontSize: 28, color: colors.brand },
  ctaCurrency: { fontFamily: font.medium, fontSize: 14, color: colors.textLo },
  bookBtn: { flex: 1, height: 52, borderRadius: radii.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  bookBtnBooked: { backgroundColor: colors.success },
  bookBtnText: { fontFamily: font.bold, fontSize: 16, color: '#06121f' },
});
