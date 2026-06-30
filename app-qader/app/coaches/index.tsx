import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, User, ChevronLeft } from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

const BASE = 'http://192.168.2.161:4000';

type Coach = {
  id: string; nameAr: string; bioAr: string | null;
  avatarUrl: string | null; specialtyAr: string | null;
  _count?: { assets: number; sessions: number };
};

export default function CoachesScreen() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Coach[]>('/coaches').then(setCoaches).catch(() => []).finally(() => setLoading(false));
  }, []);

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>المدربون</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 60 }} />
          ) : coaches.length === 0 ? (
            <View style={styles.empty}>
              <User size={40} color={colors.textLo} />
              <Text style={styles.emptyText}>لا يوجد مدربون متاحون حالياً</Text>
            </View>
          ) : coaches.map((coach) => {
            const avatarUri = coach.avatarUrl
              ? (coach.avatarUrl.startsWith('http') ? coach.avatarUrl : `${BASE}/uploads/${coach.avatarUrl}`)
              : null;
            return (
              <Pressable key={coach.id} onPress={() => router.push(`/coaches/${coach.id}` as never)}>
                <GlassCard style={styles.card}>
                  <View style={styles.avatar}>
                    {avatarUri ? (
                      <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
                    ) : (
                      <User size={28} color={colors.brand} />
                    )}
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.name}>{coach.nameAr}</Text>
                    {coach.specialtyAr && <Text style={styles.spec}>{coach.specialtyAr}</Text>}
                    {coach.bioAr && <Text style={styles.bio} numberOfLines={2}>{coach.bioAr}</Text>}
                  </View>
                  <ChevronLeft size={18} color={colors.textLo} />
                </GlassCard>
              </Pressable>
            );
          })}
          <View style={{ height: 60 }} />
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(46,197,182,0.15)', borderWidth: 1.5, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: 60, height: 60 },
  name: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right' },
  spec: { fontFamily: font.medium, fontSize: 12.5, color: colors.brand, textAlign: 'right' },
  bio: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right', lineHeight: 18 },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontFamily: font.regular, fontSize: 15, color: colors.textLo },
});
