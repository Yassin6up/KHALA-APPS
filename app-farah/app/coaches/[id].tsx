import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, User, BookOpen, CalendarPlus, Star } from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';

import { BASE as API_BASE } from '../../src/lib/api';
const BASE = API_BASE.replace('/v1', '');

type Asset = { id: string; titleAr: string; type: string; duration?: number };
type Coach = {
  id: string; nameAr: string; bioAr: string | null;
  avatarUrl: string | null; specialtyAr: string | null;
  assets?: Asset[];
};

export default function CoachDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<Coach>(`/coaches/${id}`).then(setCoach).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  function bookSession() {
    if (!authStore.isLoggedIn()) { router.push('/login' as never); return; }
    router.push(`/consult/book?coachId=${id}` as never);
  }

  if (loading) {
    return <GradientBackground><View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View></GradientBackground>;
  }
  if (!coach) {
    return <GradientBackground><View style={styles.loader}><Text style={{ color: colors.textLo }}>المدرب غير موجود</Text></View></GradientBackground>;
  }

  const avatarUri = coach.avatarUrl
    ? (coach.avatarUrl.startsWith('http') ? coach.avatarUrl : `${BASE}/uploads/${coach.avatarUrl}`)
    : null;

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>ملف المدرب</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero card */}
          <GlassCard style={styles.heroCard}>
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <User size={40} color={colors.brand} />
              )}
            </View>
            <Text style={styles.name}>{coach.nameAr}</Text>
            {coach.specialtyAr && (
              <View style={styles.specPill}>
                <Star size={12} color={colors.brand} />
                <Text style={styles.specText}>{coach.specialtyAr}</Text>
              </View>
            )}
            {coach.bioAr && <Text style={styles.bio}>{coach.bioAr}</Text>}
          </GlassCard>

          {/* Assets */}
          {coach.assets && coach.assets.length > 0 && (
            <>
              <View style={styles.sectionHead}>
                <BookOpen size={16} color={colors.brand} />
                <Text style={styles.sectionTitle}>محتوى المدرب</Text>
              </View>
              {coach.assets.map((a) => (
                <Pressable key={a.id} onPress={() => router.push(`/library/${a.id}` as never)}>
                  <GlassCard style={styles.assetRow}>
                    <View style={styles.assetIcon}>
                      <BookOpen size={16} color={colors.brand} />
                    </View>
                    <Text style={styles.assetTitle} numberOfLines={1}>{a.titleAr}</Text>
                    {a.duration && <Text style={styles.assetDur}>{Math.floor(a.duration / 60)} د</Text>}
                  </GlassCard>
                </Pressable>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Sticky book CTA */}
        <View style={styles.cta}>
          <Pressable style={styles.bookBtn} onPress={bookSession}>
            <CalendarPlus size={20} color="#06121f" />
            <Text style={styles.bookBtnText}>احجز جلسة</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  heroCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: 28 },
  avatar: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(46,197,182,0.15)', borderWidth: 2, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 90, height: 90 },
  name: { fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'center' },
  specPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(46,197,182,0.12)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5 },
  specText: { fontFamily: font.medium, fontSize: 13, color: colors.brand },
  bio: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'center', lineHeight: 22, paddingHorizontal: spacing.sm },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  assetIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(46,197,182,0.12)', alignItems: 'center', justifyContent: 'center' },
  assetTitle: { flex: 1, fontFamily: font.medium, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  assetDur: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  cta: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: 10, backgroundColor: 'transparent' },
  bookBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.brand, borderRadius: radii.pill, height: 54 },
  bookBtnText: { fontFamily: font.bold, fontSize: 17, color: '#06121f' },
});
