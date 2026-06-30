import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from 'react-native';
import {
  ArrowRight, Trophy, Zap, CheckCircle, Award,
  BookOpen, Flame, Users, Target, Brain, Star, Lock, BarChart2,
} from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { getBadgeImage } from '../src/lib/badgeImages';
import { colors, font, radii, spacing } from '../src/theme';

type Badge = { code: string; nameAr: string; iconUrl?: string; earned: boolean };
type AchievementsData = { points: number; tasksCompleted: number; badges: Badge[] };

const ACTIVITIES = [
  { icon: CheckCircle, color: '#22C55E', text: 'أكملت مهمة يومية', pts: '+١٠', time: 'اليوم' },
  { icon: BookOpen,    color: '#3B82F6', text: 'أكملت محتوى في المكتبة', pts: '+٢٠', time: 'أمس' },
  { icon: Users,       color: '#2EC5B6', text: 'شاركت في المجتمع', pts: '+٥', time: 'أمس' },
  { icon: Target,      color: '#F59E0B', text: 'أكملت التقييم الشخصي', pts: '+٥٠', time: 'منذ ٣ أيام' },
];

export default function Achievements() {
  const [data, setData] = useState<AchievementsData | null>(null);

  useEffect(() => {
    api<AchievementsData>('/me/achievements').then(setData).catch(() => null);
  }, []);

  const earned = data?.badges.filter((b) => b.earned) ?? [];
  const locked = data?.badges.filter((b) => !b.earned) ?? [];

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowRight size={22} color={colors.textMid} />
          </Pressable>
          <Text style={styles.headerTitle}>إنجازاتي</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Points hero ── */}
          <GlassCard style={styles.pointsCard} intensity={60}>
            <LinearGradient colors={['rgba(46,197,182,0.15)', 'transparent']} style={StyleSheet.absoluteFill} />
            <Trophy size={40} color={colors.brand} />
            <Text style={styles.pointsNum}>{data?.points.toLocaleString('ar') ?? '٠'}</Text>
            <Text style={styles.pointsLabel}>نقطة مكتسبة</Text>
            <View style={styles.pointsRow}>
              {[
                { icon: CheckCircle, color: '#22C55E', val: data?.tasksCompleted ?? 0, label: 'مهمة' },
                { icon: Award,       color: colors.brand, val: earned.length, label: 'وسام' },
                { icon: Flame,       color: '#F97316', val: 7, label: 'يوم' },
              ].map((s) => (
                <View key={s.label} style={styles.miniStat}>
                  <s.icon size={22} color={s.color} />
                  <Text style={styles.miniVal}>{s.val}</Text>
                  <Text style={styles.miniLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </GlassCard>

          {/* ── Earned badges ── */}
          {earned.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Trophy size={18} color={colors.brand} />
                <Text style={styles.sectionTitle}>الأوسمة المكتسبة</Text>
              </View>
              <View style={styles.badgeGrid}>
                {earned.map((b) => {
                  const img = getBadgeImage(b.code);
                  return (
                    <GlassCard key={b.code} style={styles.badgeCard} intensity={50}>
                      {img ? (
                        <Image source={img} style={styles.badgeImg} />
                      ) : (
                        <Text style={{ fontSize: 36 }}>{b.iconUrl ?? '🏅'}</Text>
                      )}
                      <Text style={styles.badgeName}>{b.nameAr}</Text>
                      <View style={styles.earnedDot} />
                    </GlassCard>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Locked badges ── */}
          {locked.length > 0 && (
            <>
              <View style={[styles.sectionHeader, { marginTop: spacing.sm }]}>
                <Lock size={16} color={colors.textLo} />
                <Text style={[styles.sectionTitle, { color: colors.textLo }]}>أوسمة قادمة</Text>
              </View>
              <View style={styles.badgeGrid}>
                {locked.map((b) => {
                  const img = getBadgeImage(b.code);
                  return (
                    <GlassCard key={b.code} style={[styles.badgeCard, styles.lockedCard]} intensity={20}>
                      {img ? (
                        <Image source={img} style={[styles.badgeImg, { opacity: 0.3 }]} />
                      ) : (
                        <Text style={{ fontSize: 36, opacity: 0.3 }}>{b.iconUrl ?? '🏅'}</Text>
                      )}
                      <Text style={[styles.badgeName, { color: colors.textLo }]}>{b.nameAr}</Text>
                      <Text style={styles.lockIcon}>🔒</Text>
                    </GlassCard>
                  );
                })}
              </View>
            </>
          )}

          {/* ── Activity timeline ── */}
          <GlassCard style={styles.timeline}>
            <View style={styles.sectionHeader}>
              <BarChart2 size={18} color={colors.textMid} />
              <Text style={styles.timelineTitle}>آخر النشاطات</Text>
            </View>
            {ACTIVITIES.map((a, i) => (
              <View key={i} style={[styles.activityRow, i > 0 && styles.actBorder]}>
                <Text style={styles.actPts}>{a.pts}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actText}>{a.text}</Text>
                  <Text style={styles.actTime}>{a.time}</Text>
                </View>
                <View style={[styles.actIconWrap, { backgroundColor: a.color + '18' }]}>
                  <a.icon size={18} color={a.color} />
                </View>
              </View>
            ))}
          </GlassCard>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'right' },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  pointsCard: { alignItems: 'center', gap: spacing.sm, overflow: 'hidden', paddingVertical: spacing.xl },
  pointsNum: { fontFamily: font.bold, fontSize: 52, color: colors.brand, lineHeight: 60 },
  pointsLabel: { fontFamily: font.regular, color: colors.textLo, fontSize: 15 },
  pointsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.sm },
  miniStat: { alignItems: 'center', gap: 6 },
  miniVal: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  miniLabel: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badgeCard: { width: '30%', alignItems: 'center', gap: 10, paddingVertical: spacing.lg, position: 'relative' },
  lockedCard: { opacity: 0.55 },
  badgeImg: { width: 64, height: 64, resizeMode: 'contain' },
  badgeName: { fontFamily: font.medium, fontSize: 11, color: colors.textHi, textAlign: 'center' },
  earnedDot: { position: 'absolute', top: 8, left: 8, width: 8, height: 8, borderRadius: 8, backgroundColor: colors.brand },
  lockIcon: { position: 'absolute', top: 8, left: 8, fontSize: 12 },
  timeline: { gap: spacing.sm },
  timelineTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 10 },
  actBorder: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
  actPts: { fontFamily: font.bold, fontSize: 14, color: colors.brand, minWidth: 44, textAlign: 'right' },
  actText: { fontFamily: font.medium, fontSize: 13, color: colors.textHi, textAlign: 'right' },
  actTime: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right', marginTop: 2 },
  actIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
