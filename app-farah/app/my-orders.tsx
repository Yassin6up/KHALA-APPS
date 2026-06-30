import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, ShoppingBag, Clock, CheckCircle, XCircle, Package } from 'lucide-react-native';
import { api } from '../src/lib/api';
import { colors, font, radii, spacing } from '../src/theme';

type Booking = {
  id: string; status: string; createdAt: string;
  item: { titleAr: string; coverUrl: string | null; priceMinor: number; currency: string };
  payment: { rawJson: any; status: string } | null;
};

const STATUS: Record<string, { label: string; color: string; icon: any }> = {
  reserved:  { label: 'قيد المراجعة', color: '#F59E0B', icon: Clock },
  paid:      { label: 'تم الدفع', color: colors.success, icon: CheckCircle },
  attended:  { label: 'تم التسليم', color: colors.brand2, icon: Package },
  canceled:  { label: 'ملغى', color: colors.danger, icon: XCircle },
};

export default function MyOrders() {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Booking[]>('/me/bookings').then(setOrders).catch(() => null).finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>طلباتي</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>جارٍ التحميل…</Text>
        ) : orders.length === 0 ? (
          <View style={styles.emptyBlock}>
            <View style={styles.emptyIcon}><ShoppingBag size={32} color={colors.textLo} /></View>
            <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
            <Text style={styles.emptySub}>تصفّح السوق واطلب خدمتك المفضلة</Text>
            <Pressable onPress={() => router.replace('/(tabs)/marketplace')} style={styles.emptyBtn}>
              <Text style={styles.emptyBtnText}>تصفّح السوق</Text>
            </Pressable>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {orders.map((o) => {
              const st = STATUS[o.status] ?? STATUS.reserved;
              const Icon = st.icon;
              const cover = o.item.coverUrl?.startsWith('http')
                ? o.item.coverUrl
                : o.item.coverUrl
                ? `http://192.168.2.161:4000/uploads/${o.item.coverUrl}`
                : null;
              const rawJson = o.payment?.rawJson as any;
              const price = (o.item.priceMinor / 1000).toFixed(o.item.priceMinor % 1000 === 0 ? 0 : 3);
              const date = new Date(o.createdAt).toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });

              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    {cover ? (
                      <Image source={{ uri: cover }} style={styles.thumb} resizeMode="cover" />
                    ) : (
                      <View style={[styles.thumb, { backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' }]}>
                        <ShoppingBag size={22} color={colors.brand} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{o.item.titleAr}</Text>
                      <Text style={styles.itemDate}>{date}</Text>
                      <Text style={styles.itemPrice}>{price} {o.item.currency}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: st.color + '18' }]}>
                      <Icon size={13} color={st.color} />
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>

                  {rawJson?.address && (
                    <View style={styles.cardFoot}>
                      <Text style={styles.footLabel}>العنوان: </Text>
                      <Text style={styles.footVal}>{rawJson.address}</Text>
                    </View>
                  )}
                  {rawJson?.phone && (
                    <View style={styles.cardFoot}>
                      <Text style={styles.footLabel}>الهاتف: </Text>
                      <Text style={styles.footVal}>{rawJson.phone}</Text>
                    </View>
                  )}

                  {/* Status timeline */}
                  <View style={styles.timeline}>
                    {(['reserved', 'paid', 'attended'] as const).map((s, i) => {
                      const idx = ['reserved', 'paid', 'attended'].indexOf(o.status);
                      const active = i <= idx;
                      return (
                        <View key={s} style={styles.timelineStep}>
                          <View style={[styles.timelineDot, active && { backgroundColor: colors.brand }]} />
                          {i < 2 && <View style={[styles.timelineLine, active && i < idx && { backgroundColor: colors.brand }]} />}
                          <Text style={[styles.timelineLabel, active && { color: colors.brand }]}>
                            {s === 'reserved' ? 'مؤكد' : s === 'paid' ? 'مدفوع' : 'مُسلَّم'}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </View>
        )}

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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 40 },
  emptyBlock: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyIcon: { width: 72, height: 72, borderRadius: 20, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  emptyTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  emptySub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  emptyBtn: { backgroundColor: colors.brand, borderRadius: radii.pill, paddingHorizontal: 28, height: 46, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  emptyBtnText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  thumb: { width: 56, height: 56, borderRadius: 13, overflow: 'hidden' },
  itemTitle: { fontFamily: font.bold, fontSize: 14.5, color: colors.textHi, textAlign: 'right' },
  itemDate: { fontFamily: font.regular, fontSize: 11.5, color: colors.textLo, textAlign: 'right' },
  itemPrice: { fontFamily: font.bold, fontSize: 14, color: colors.brand, textAlign: 'right' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  statusText: { fontFamily: font.bold, fontSize: 11 },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  footLabel: { fontFamily: font.medium, fontSize: 12, color: colors.textLo },
  footVal: { fontFamily: font.regular, fontSize: 12, color: colors.textMid },
  timeline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, paddingTop: 4 },
  timelineStep: { alignItems: 'center', gap: 5, flex: 1 },
  timelineDot: { width: 10, height: 10, borderRadius: 10, backgroundColor: colors.glassBorder },
  timelineLine: { position: 'absolute', top: 4, right: '50%', width: '100%', height: 2, backgroundColor: colors.glassBorder },
  timelineLabel: { fontFamily: font.regular, fontSize: 10.5, color: colors.textLo },
});
