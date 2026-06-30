import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { getBadgeImage } from '../../src/lib/badgeImages';
import { colors, font, radii, spacing, type } from '../../src/theme';
import {
  Trophy, CheckCircle, Award,
  ChevronLeft, Zap, Bell, Settings, HelpCircle, Link as LinkIcon, Diamond,
  CalendarDays,
} from 'lucide-react-native';

type MeData = {
  user: { fullName?: string; phone?: string; email?: string };
  points: number;
  subscription: { plan: { nameAr: string; audience: string } } | null;
};

type AchievementsData = { points: number; tasksCompleted: number; badges: { code: string; nameAr: string; iconUrl?: string; earned: boolean }[] };


type Row = { label: string; icon: React.FC<any>; route: string; danger?: boolean };

const MENU_ROWS: Row[] = [
  { label: 'اشتراكي', icon: Diamond, route: '/subscription' },
  { label: 'إنجازاتي ونقاطي', icon: Trophy, route: '/achievements' },
  { label: 'جلساتي مع المدربين', icon: CalendarDays, route: '/consult/sessions' },
  { label: 'دعوة الأصدقاء', icon: LinkIcon, route: '/referrals' },
  { label: 'الإشعارات', icon: Bell, route: '/notifications' },
  { label: 'الإعدادات', icon: Settings, route: '/settings' },
  { label: 'المساعدة والدعم', icon: HelpCircle, route: '/settings' },
];

export default function Profile() {
  const [me, setMe] = useState<MeData | null>(null);
  const [ach, setAch] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<MeData>('/me').then(setMe).catch(() => null),
      api<AchievementsData>('/me/achievements').then(setAch).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  function logout() {
    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: async () => {
          await authStore.clear();
          router.replace('/login');
        },
      },
    ]);
  }

  const name = me?.user?.fullName ?? 'مستخدم قادر';
  const initials = name.charAt(0);
  const sub = me?.subscription?.plan?.nameAr ?? null;
  const earnedBadges = ach?.badges.filter((b) => b.earned) ?? [];

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ gap: spacing.md }}>
            <View style={styles.head}>
               <View style={[styles.avatar, { backgroundColor: colors.glassFillStrong }]} />
               <View style={{ width: 120, height: 24, backgroundColor: colors.glassFillStrong, borderRadius: 4, marginTop: 8 }} />
            </View>
            <GlassCard style={{ height: 100 }} />
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {[1, 2, 3, 4, 5].map((i) => <GlassCard key={i} style={{ height: 60 }} />)}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.head}>
              <LinearGradient colors={['#2EC5B6', '#6C8BFF']} style={styles.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <Text style={[type.h1, { textAlign: 'center' }]}>{name}</Text>
              {sub && (
                <View style={styles.subBadge}>
                  <Text style={styles.subBadgeText}>⭐ {sub}</Text>
                </View>
              )}
              {!sub && <Text style={styles.memberLabel}>عضو في قادر</Text>}
            </View>

            <GlassCard style={styles.statsRow}>
              {[
                { icon: Zap, label: 'نقاط', val: (ach?.points ?? me?.points ?? 0).toLocaleString('ar'), color: '#F59E0B' },
                { icon: CheckCircle, label: 'مهام مكتملة', val: (ach?.tasksCompleted ?? 0).toString(), color: colors.success },
                { icon: Award, label: 'أوسمة', val: earnedBadges.length.toString(), color: colors.brand },
              ].map((s, i) => (
                <View key={s.label} style={[styles.stat, i < 2 && styles.statBorder]}>
                  <s.icon size={24} color={s.color} style={{ marginBottom: 4 }} />
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </GlassCard>

            {earnedBadges.length > 0 && (
              <Pressable onPress={() => router.push('/achievements' as never)}>
                <GlassCard>
                  <View style={styles.badgesTitleRow}>
                    <Trophy size={15} color={colors.brand} />
                    <Text style={styles.badgesTitle}>الأوسمة المكتسبة</Text>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.badgesSeeAll}>عرض الكل ›</Text>
                  </View>
                  <View style={styles.badgeRow}>
                    {earnedBadges.slice(0, 5).map((b) => {
                      const img = getBadgeImage(b.code);
                      return (
                        <View key={b.code} style={styles.badgeItem}>
                          <View style={styles.badgeImgWrap}>
                            {img ? (
                              <Image source={img} style={styles.badgeImg} />
                            ) : (
                              <Text style={styles.badgeEmoji}>{b.iconUrl ?? '🏅'}</Text>
                            )}
                          </View>
                          <Text style={styles.badgeLabel} numberOfLines={2}>{b.nameAr}</Text>
                        </View>
                      );
                    })}
                    {earnedBadges.length > 5 && (
                      <View style={styles.badgeMore}>
                        <Text style={styles.badgeMoreText}>+{earnedBadges.length - 5}</Text>
                      </View>
                    )}
                  </View>
                </GlassCard>
              </Pressable>
            )}

            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {MENU_ROWS.map((row) => (
                <Pressable key={row.label} onPress={() => router.push(row.route as never)}>
                  <GlassCard style={styles.menuRow}>
                    <row.icon size={20} color={colors.textHi} style={styles.menuIcon} />
                    <Text style={styles.menuLabel}>{row.label}</Text>
                    <ChevronLeft size={20} color={colors.textLo} />
                  </GlassCard>
                </Pressable>
              ))}
            </View>

            <Pressable onPress={logout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>تسجيل الخروج</Text>
            </Pressable>
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  head: { alignItems: 'center', gap: 8, marginTop: spacing.sm, marginBottom: spacing.sm },
  avatar: { width: 90, height: 90, borderRadius: 90, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.bold, fontSize: 40, color: '#fff' },
  subBadge: { backgroundColor: 'rgba(233,196,106,0.15)', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 5, borderWidth: 1, borderColor: colors.gold },
  subBadgeText: { fontFamily: font.bold, fontSize: 13, color: colors.gold },
  memberLabel: { fontFamily: font.regular, color: colors.textLo, fontSize: 14 },
  statsRow: { flexDirection: 'row' },
  stat: { flex: 1, alignItems: 'center', gap: 4 },
  statBorder: { borderLeftWidth: 1, borderLeftColor: colors.glassBorder },
  statVal: { fontFamily: font.bold, fontSize: 20, color: colors.brand },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  badgesTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  badgesTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi },
  badgesSeeAll: { fontFamily: font.regular, fontSize: 12, color: colors.brand },
  badgeRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, flexWrap: 'wrap' },
  badgeItem: { alignItems: 'center', width: 56, gap: 6 },
  badgeImgWrap: { width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(46,197,182,0.08)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(46,197,182,0.2)' },
  badgeImg: { width: 40, height: 40, resizeMode: 'contain' },
  badgeEmoji: { fontSize: 28 },
  badgeLabel: { fontFamily: font.regular, fontSize: 10, color: colors.textMid, textAlign: 'center' },
  badgeMore: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.glassFillStrong, alignItems: 'center', justifyContent: 'center' },
  badgeMoreText: { fontFamily: font.bold, fontSize: 13, color: colors.textMid },
  menuRow: { flexDirection: 'row', alignItems: 'center' },
  menuIcon: { marginLeft: spacing.sm },
  menuLabel: { flex: 1, fontFamily: font.medium, fontSize: 16, color: colors.textHi, textAlign: 'right', marginRight: spacing.sm },
  logoutBtn: {
    borderRadius: radii.pill, borderWidth: 1, borderColor: colors.danger,
    paddingVertical: 14, alignItems: 'center', marginTop: spacing.sm,
  },
  logoutText: { fontFamily: font.bold, fontSize: 16, color: colors.danger },
});
