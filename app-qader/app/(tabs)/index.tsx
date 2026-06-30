import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../src/theme';

type CatalogItem = { id: string; titleAr: string; type: string; priceMinor: number; startsAt?: string };
type DailyTask = { id: string; titleAr: string; status: string };
type MeData = { user: { fullName?: string }; points: number };

export default function Home() {
  const [me, setMe] = useState<MeData | null>(null);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [progress] = useState(68);

  useEffect(() => {
    api<MeData>('/me').then(setMe).catch(() => null);
    api<DailyTask[]>('/mentor/tasks').then(setTasks).catch(() => []);
    api<CatalogItem[]>('/catalog').then((d) => setCatalog(d.slice(0, 3))).catch(() => []);
  }, []);

  const firstName = me?.user?.fullName?.split(' ')[0] ?? 'بك';

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.hello}>مرحباً {firstName} 👋</Text>
            <Text style={[type.h1]}>لنواصل تقدّمك اليوم</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.bellWrap}>
            <GlassCard style={styles.bell}><Text style={{ fontSize: 20 }}>🔔</Text></GlassCard>
          </Pressable>
        </View>

        {/* Progress ring card */}
        <GlassCard style={styles.progressCard}>
          <View style={styles.ringWrap}>
            <View style={styles.ring}>
              <Text style={styles.ringPct}>{progress}٪</Text>
            </View>
            <View style={styles.ringDeco} />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.cardTitle}>خطة التطوير الأسبوعية</Text>
            <Text style={styles.cardSub}>أكملت {progress}٪ من مهامك هذا الأسبوع</Text>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#2EC5B6', '#6C8BFF']}
                style={[styles.progressFill, { width: `${progress}%` }]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
            </View>
          </View>
        </GlassCard>

        {/* Daily tasks */}
        <View style={styles.sectionRow}>
          <Text style={[type.h2]}>مهام اليوم</Text>
          <Pressable onPress={() => router.push('/achievements')}>
            <Text style={styles.seeAll}>الكل</Text>
          </Pressable>
        </View>

        {tasks.length === 0 ? (
          <GlassCard>
            <Text style={[styles.cardSub, { textAlign: 'center' }]}>لا توجد مهام مجدولة اليوم 🎉</Text>
          </GlassCard>
        ) : (
          tasks.slice(0, 3).map((t) => (
            <Pressable key={t.id} style={{ marginBottom: spacing.sm }}>
              <GlassCard style={styles.taskRow}>
                <View style={[styles.taskDot, t.status === 'done' && styles.taskDotDone]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTitle, t.status === 'done' && { color: colors.textLo, textDecorationLine: 'line-through' }]}>
                    {t.titleAr}
                  </Text>
                </View>
                {t.status === 'done' && <Text style={{ fontSize: 16 }}>✅</Text>}
              </GlassCard>
            </Pressable>
          ))
        )}

        {/* Quick stats */}
        <GlassCard style={styles.statsRow}>
          {[
            { icon: '⚡', label: 'نقاط', val: me?.points.toLocaleString('ar') ?? '٠' },
            { icon: '🔥', label: 'أيام متواصلة', val: '٧' },
            { icon: '📚', label: 'محتوى مكتمل', val: '١٢' },
          ].map((s, i) => (
            <View key={s.label} style={[styles.stat, i < 2 && styles.statBorder]}>
              <Text style={{ fontSize: 22 }}>{s.icon}</Text>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Catalog suggestions */}
        <View style={styles.sectionRow}>
          <Text style={[type.h2]}>مقترح لك</Text>
          <Pressable onPress={() => router.push('/catalog/all' as never)}>
            <Text style={styles.seeAll}>الكل</Text>
          </Pressable>
        </View>

        {catalog.map((item) => (
          <Pressable key={item.id} onPress={() => router.push(`/catalog/${item.id}` as never)} style={{ marginBottom: spacing.sm }}>
            <GlassCard style={styles.catalogCard}>
              <View style={styles.catalogThumb}>
                <Text style={{ fontSize: 28 }}>
                  {item.type === 'workshop' ? '🎓' : item.type === 'camp' ? '⛺' : '📖'}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.cardTitle}>{item.titleAr}</Text>
                <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end' }}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.type === 'workshop' ? 'ورشة' : item.type === 'camp' ? 'معسكر' : 'كورس'}</Text>
                  </View>
                  <Text style={[styles.cardSub, { color: colors.brand }]}>
                    {(item.priceMinor / 1000).toFixed(3)} ر.ع
                  </Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: spacing.sm },
  hello: { fontFamily: font.regular, color: colors.textLo, textAlign: 'right', marginBottom: 2 },
  bellWrap: {},
  bell: { padding: 0, width: 44, height: 44, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  progressCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ringWrap: { position: 'relative' },
  ring: {
    width: 70, height: 70, borderRadius: 70, borderWidth: 5, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(46,197,182,0.08)',
  },
  ringDeco: {
    position: 'absolute', width: 70, height: 70, borderRadius: 70,
    borderWidth: 5, borderColor: 'transparent', borderTopColor: colors.brand2,
    transform: [{ rotate: '200deg' }], opacity: 0.4,
  },
  ringPct: { fontFamily: font.bold, color: colors.brand, fontSize: 16 },
  progressBar: { height: 4, borderRadius: 4, backgroundColor: colors.glassFill, overflow: 'hidden', marginTop: 4 },
  progressFill: { height: 4, borderRadius: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  seeAll: { fontFamily: font.medium, color: colors.brand, fontSize: 14 },
  cardTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  cardSub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  taskDot: { width: 12, height: 12, borderRadius: 12, backgroundColor: colors.brand, flexShrink: 0 },
  taskDotDone: { backgroundColor: colors.success },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.glassBorder },
  statVal: { fontFamily: font.bold, fontSize: 18, color: colors.brand },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  catalogCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  catalogThumb: {
    width: 56, height: 56, borderRadius: radii.sm,
    backgroundColor: 'rgba(46,197,182,0.12)', alignItems: 'center', justifyContent: 'center',
  },
  typeBadge: { backgroundColor: 'rgba(46,197,182,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 2 },
  typeText: { fontFamily: font.medium, fontSize: 11, color: colors.brand },
});
