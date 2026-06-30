import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Award, Lock, CheckCircle, Star } from 'lucide-react-native';
import { api } from '../src/lib/api';
import { colors, font, radii, spacing } from '../src/theme';

const BASE = 'http://192.168.2.161:4000';

type Badge = {
  id: string; code: string; nameAr: string;
  iconUrl: string | null; earned: boolean;
};

type Achievements = {
  points: number;
  tasksCompleted: number;
  badges: Badge[];
};

const BADGE_HINTS: Record<string, string> = {
  reader:    'اقرأ ٥ مقالات أو تصفّح المحتوى',
  streak:    'سجّل الدخول ٣ أيام متتالية',
  community: 'شارك في المجتمع وأرسل ٥ رسائل',
  planner:   'أنشئ أول مناسبة لك',
  gifter:    'اطلب هدية أول مرة',
  organizer: 'أكمل تفاصيل المناسبة كاملة',
};

export default function AchievementsPage() {
  const [data, setData] = useState<Achievements | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Achievements>('/me/achievements')
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const earned = data?.badges.filter((b) => b.earned) ?? [];
  const locked = data?.badges.filter((b) => !b.earned) ?? [];

  function BadgeCard({ badge }: { badge: Badge }) {
    const iconUri = badge.iconUrl
      ? badge.iconUrl.startsWith('http')
        ? badge.iconUrl
        : `${BASE}/uploads/${badge.iconUrl}`
      : null;
    const hint = BADGE_HINTS[badge.code] ?? 'استمر في النشاط لفتح هذا الوسام';

    return (
      <View style={[styles.badgeCard, !badge.earned && styles.badgeCardLocked]}>
        {/* Icon */}
        <View style={[styles.badgeIconWrap, badge.earned ? styles.badgeIconEarned : styles.badgeIconLocked]}>
          {iconUri ? (
            <Image
              source={{ uri: iconUri }}
              style={[styles.badgeImg, !badge.earned && { opacity: 0.25 }]}
              resizeMode="contain"
            />
          ) : (
            <Text style={{ fontSize: 32, opacity: badge.earned ? 1 : 0.25 }}>🏅</Text>
          )}
          {badge.earned && (
            <View style={styles.checkBadge}>
              <CheckCircle size={14} color="#fff" fill={colors.success} />
            </View>
          )}
          {!badge.earned && (
            <View style={styles.lockBadge}>
              <Lock size={12} color="#fff" />
            </View>
          )}
        </View>

        {/* Text */}
        <Text style={[styles.badgeName, !badge.earned && styles.badgeNameLocked]} numberOfLines={2}>
          {badge.nameAr}
        </Text>
        <Text style={styles.badgeHint} numberOfLines={2}>
          {badge.earned ? '✓ تم الفتح' : hint}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>أوسمتي</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Stats hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroLeft}>
            <Award size={28} color={colors.gold} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              {loading ? '–' : `${earned.length} / ${(data?.badges.length ?? 0)}`}
            </Text>
            <Text style={styles.heroSub}>وسام مفتوح من أصل {loading ? '–' : data?.badges.length ?? 0}</Text>
          </View>
          <View style={styles.pointsPill}>
            <Star size={13} color={colors.gold} fill={colors.gold} />
            <Text style={styles.pointsText}>{loading ? '–' : data?.points ?? 0} نقطة</Text>
          </View>
        </View>

        {/* Progress bar */}
        {data && data.badges.length > 0 && (
          <View style={styles.progressWrap}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(earned.length / data.badges.length) * 100}%` as any }]} />
            </View>
            <Text style={styles.progressLabel}>{Math.round((earned.length / data.badges.length) * 100)}% مكتمل</Text>
          </View>
        )}

        {loading ? (
          <Text style={styles.empty}>جارٍ التحميل…</Text>
        ) : !data || data.badges.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Award size={40} color={colors.textLo} />
            <Text style={styles.emptyTitle}>لا توجد أوسمة بعد</Text>
            <Text style={styles.emptySub}>ابدأ بالنشاط لفتح أوسمتك الأولى</Text>
          </View>
        ) : (
          <>
            {/* Earned section */}
            {earned.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>المفتوحة</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.countText, { color: colors.success }]}>{earned.length}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {earned.map((b) => <BadgeCard key={b.id} badge={b} />)}
                </View>
              </>
            )}

            {/* Locked section */}
            {locked.length > 0 && (
              <>
                <View style={styles.sectionHead}>
                  <Text style={styles.sectionTitle}>قيد الفتح</Text>
                  <View style={[styles.countBadge, { backgroundColor: colors.glassBorder }]}>
                    <Text style={[styles.countText, { color: colors.textLo }]}>{locked.length}</Text>
                  </View>
                </View>
                <View style={styles.grid}>
                  {locked.map((b) => <BadgeCard key={b.id} badge={b} />)}
                </View>
              </>
            )}
          </>
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
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { padding: spacing.lg },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: colors.goldSoft, borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.25)', marginBottom: spacing.md,
  },
  heroLeft: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)' },
  heroTitle: { fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'right' },
  heroSub: { fontFamily: font.regular, fontSize: 12, color: colors.textMid, textAlign: 'right', marginTop: 2 },
  pointsPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fff', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)' },
  pointsText: { fontFamily: font.bold, fontSize: 13, color: '#92400E' },

  progressWrap: { marginBottom: spacing.lg, gap: 6 },
  progressBar: { height: 8, backgroundColor: colors.bg2, borderRadius: 99, overflow: 'hidden' },
  progressFill: { height: 8, backgroundColor: colors.gold, borderRadius: 99 },
  progressLabel: { fontFamily: font.medium, fontSize: 12, color: colors.textMid, textAlign: 'right' },

  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginBottom: spacing.sm, marginTop: spacing.sm },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  countBadge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3 },
  countText: { fontFamily: font.bold, fontSize: 12 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: spacing.md },

  badgeCard: {
    flexBasis: '30%', flexGrow: 1, alignItems: 'center', gap: 8,
    backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  badgeCardLocked: { backgroundColor: colors.bg1, borderStyle: 'dashed' },

  badgeIconWrap: { width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  badgeIconEarned: { backgroundColor: colors.goldSoft, borderWidth: 2, borderColor: 'rgba(245,179,1,0.4)' },
  badgeIconLocked: { backgroundColor: colors.bg2, borderWidth: 1.5, borderColor: colors.glassBorder },
  badgeImg: { width: 48, height: 48 },

  checkBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  lockBadge: { position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: 22, backgroundColor: colors.textLo, alignItems: 'center', justifyContent: 'center' },

  badgeName: { fontFamily: font.bold, fontSize: 12.5, color: colors.textHi, textAlign: 'center' },
  badgeNameLocked: { color: colors.textLo },
  badgeHint: { fontFamily: font.regular, fontSize: 10.5, color: colors.textLo, textAlign: 'center', lineHeight: 15 },

  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 40 },
  emptyBlock: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  emptyTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  emptySub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
});
