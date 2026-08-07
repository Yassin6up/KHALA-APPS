import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CalendarDays, Clock, ChevronLeft, Video } from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

type Coach = { id: string; nameAr: string; specialtyAr: string | null };
type Session = {
  id: string; status: string; scheduledAt: string; durationMin: number;
  meetingUrl: string | null; coach: Coach;
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: 'محجوزة',  color: colors.brand },
  confirmed:  { label: 'مؤكدة',   color: '#22C55E' },
  done:       { label: 'منتهية',  color: colors.textLo },
  canceled:   { label: 'ملغاة',   color: colors.danger },
};

export default function MySessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Session[]>('/consult/my-sessions').then(setSessions).catch(() => []).finally(() => setLoading(false));
  }, []);

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>جلساتي</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {loading ? (
            <ActivityIndicator color={colors.brand} style={{ marginTop: 60 }} />
          ) : sessions.length === 0 ? (
            <View style={styles.empty}>
              <CalendarDays size={40} color={colors.textLo} />
              <Text style={styles.emptyTitle}>لا توجد جلسات بعد</Text>
              <Text style={styles.emptyDesc}>احجز جلستك الأولى مع أحد المدربين</Text>
              <Pressable style={styles.browseBtn} onPress={() => router.push('/(tabs)/library' as never)}>
                <Text style={styles.browseBtnText}>تصفح المدربين</Text>
              </Pressable>
            </View>
          ) : sessions.map((s) => {
            const st = STATUS_MAP[s.status] ?? STATUS_MAP.scheduled;
            const date = new Date(s.scheduledAt);
            const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
            return (
              <Pressable key={s.id} onPress={() => router.push(`/consult/session/${s.id}` as never)}>
                <GlassCard style={styles.card}>
                  <View style={styles.cardLeft}>
                    <View style={styles.statusDot}>
                      <Video size={16} color={st.color} />
                    </View>
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={styles.cardTop}>
                      <View style={[styles.statusPill, { backgroundColor: st.color + '1A', borderColor: st.color + '50' }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                      <Text style={styles.coachName}>{s.coach.nameAr}</Text>
                    </View>
                    <View style={styles.cardDateRow}>
                      <View style={styles.dateItem}>
                        <Clock size={12} color={colors.textLo} />
                        <Text style={styles.dateText}>{timeStr} · {s.durationMin} د</Text>
                      </View>
                      <View style={styles.dateItem}>
                        <CalendarDays size={12} color={colors.textLo} />
                        <Text style={styles.dateText}>{dateStr}</Text>
                      </View>
                    </View>
                    {s.meetingUrl && s.status !== 'canceled' && s.status !== 'done' && (
                      <Text style={styles.hasLink}>🔗 رابط الاجتماع متاح</Text>
                    )}
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
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingTop: spacing.sm },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  emptyDesc: { fontFamily: font.regular, fontSize: 14, color: colors.textLo },
  browseBtn: { marginTop: 8, paddingHorizontal: 28, paddingVertical: 12, backgroundColor: colors.brand, borderRadius: radii.pill },
  browseBtnText: { fontFamily: font.bold, fontSize: 14, color: '#06121f' },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardLeft: { alignItems: 'center', justifyContent: 'center' },
  statusDot: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  coachName: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, flex: 1, textAlign: 'right' },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontFamily: font.bold, fontSize: 11.5 },
  cardDateRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end' },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  hasLink: { fontFamily: font.regular, fontSize: 12, color: colors.brand, textAlign: 'right' },
});
