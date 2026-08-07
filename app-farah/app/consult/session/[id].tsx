import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, Share, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight, Video, CalendarDays, Clock, Copy, ExternalLink,
  CheckCircle, XCircle, User,
} from 'lucide-react-native';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientBackground } from '../../../src/components/GradientBackground';
import { api } from '../../../src/lib/api';
import { colors, font, radii, spacing } from '../../../src/theme';

type Coach = { id: string; nameAr: string; specialtyAr: string | null; avatarUrl: string | null };
type Session = {
  id: string; status: string; scheduledAt: string; durationMin: number;
  meetingUrl: string | null; notesAr: string | null; channel: string;
  coach: Coach;
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  scheduled: { label: 'محجوزة', color: colors.brand, icon: CalendarDays },
  confirmed:  { label: 'مؤكدة',  color: '#22C55E', icon: CheckCircle },
  done:       { label: 'منتهية', color: colors.textLo, icon: CheckCircle },
  canceled:   { label: 'ملغاة',  color: colors.danger, icon: XCircle },
};

export default function SessionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Session>(`/consult/sessions/${id}`).then(setSession).catch(() => null).finally(() => setLoading(false));
  }, [id]);

  async function joinMeeting() {
    if (!session?.meetingUrl) return;
    await WebBrowser.openBrowserAsync(session.meetingUrl);
  }

  async function copyLink() {
    if (!session?.meetingUrl) return;
    await Share.share({ message: session.meetingUrl, url: session.meetingUrl });
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  if (loading) {
    return <GradientBackground><View style={styles.loader}><ActivityIndicator color={colors.brand} size="large" /></View></GradientBackground>;
  }
  if (!session) {
    return <GradientBackground><View style={styles.loader}><Text style={{ color: colors.textLo }}>الجلسة غير موجودة</Text></View></GradientBackground>;
  }

  const st = STATUS_MAP[session.status] ?? STATUS_MAP.scheduled;
  const date = new Date(session.scheduledAt);
  const dateStr = date.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  const isPast = date < new Date();
  const canJoin = session.status !== 'canceled' && session.status !== 'done' && session.meetingUrl;

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>تفاصيل الجلسة</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Status banner */}
          <View style={[styles.statusBanner, { backgroundColor: st.color + '18', borderColor: st.color + '40' }]}>
            <st.icon size={20} color={st.color} />
            <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
          </View>

          {/* Coach info */}
          <GlassCard style={styles.coachCard}>
            <View style={styles.coachAvatar}>
              <User size={22} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.coachName}>{session.coach.nameAr}</Text>
              {session.coach.specialtyAr && <Text style={styles.coachSpec}>{session.coach.specialtyAr}</Text>}
            </View>
          </GlassCard>

          {/* Session details */}
          <GlassCard style={styles.detailCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailVal}>{dateStr}</Text>
              <View style={styles.detailLabel}>
                <CalendarDays size={15} color={colors.textLo} />
                <Text style={styles.detailLabelText}>التاريخ</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailVal}>{timeStr}</Text>
              <View style={styles.detailLabel}>
                <Clock size={15} color={colors.textLo} />
                <Text style={styles.detailLabelText}>الوقت</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailVal}>{session.durationMin} دقيقة</Text>
              <View style={styles.detailLabel}>
                <Clock size={15} color={colors.textLo} />
                <Text style={styles.detailLabelText}>المدة</Text>
              </View>
            </View>
            <View style={[styles.detailRow, styles.detailRowBorder]}>
              <Text style={styles.detailVal}>فيديو</Text>
              <View style={styles.detailLabel}>
                <Video size={15} color={colors.textLo} />
                <Text style={styles.detailLabelText}>القناة</Text>
              </View>
            </View>
          </GlassCard>

          {/* Meeting link */}
          {session.meetingUrl && (
            <GlassCard style={styles.meetingCard}>
              <View style={styles.meetingHead}>
                <Video size={18} color={colors.brand} />
                <Text style={styles.meetingTitle}>رابط الاجتماع</Text>
              </View>
              <Text style={styles.meetingUrl} numberOfLines={2}>{session.meetingUrl}</Text>
              <View style={styles.meetingBtns}>
                <Pressable style={styles.copyBtn} onPress={copyLink}>
                  <Copy size={15} color={colors.brand} />
                  <Text style={styles.copyBtnText}>{copied ? 'تم النسخ!' : 'مشاركة الرابط'}</Text>
                </Pressable>
                {canJoin && (
                  <Pressable style={styles.joinBtn} onPress={joinMeeting}>
                    <ExternalLink size={15} color="#06121f" />
                    <Text style={styles.joinBtnText}>انضم الآن</Text>
                  </Pressable>
                )}
              </View>
            </GlassCard>
          )}

          {/* Notes */}
          {session.notesAr && (
            <GlassCard style={styles.notesCard}>
              <Text style={styles.notesLabel}>ملاحظاتك للمدرب</Text>
              <Text style={styles.notesText}>{session.notesAr}</Text>
            </GlassCard>
          )}

          {/* Reminder */}
          {canJoin && !isPast && (
            <View style={styles.reminder}>
              <Text style={styles.reminderText}>
                📧 تم إرسال رابط الاجتماع إلى بريدك الإلكتروني وبريد المدرب
              </Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
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
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, justifyContent: 'center' },
  statusText: { fontFamily: font.bold, fontSize: 16 },
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(46,197,182,0.15)', borderWidth: 1.5, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  coachName: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right' },
  coachSpec: { fontFamily: font.regular, fontSize: 12.5, color: colors.brand, textAlign: 'right', marginTop: 2 },
  detailCard: { gap: 0, padding: 0, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
  detailLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailLabelText: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  detailVal: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  meetingCard: { gap: spacing.sm },
  meetingHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  meetingTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi },
  meetingUrl: { fontFamily: font.regular, fontSize: 11.5, color: colors.textLo, textAlign: 'right', backgroundColor: colors.glassFill, padding: 10, borderRadius: 8 },
  meetingBtns: { flexDirection: 'row', gap: 10, marginTop: 4 },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: colors.brand },
  copyBtnText: { fontFamily: font.bold, fontSize: 13, color: colors.brand },
  joinBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 12, borderRadius: 10, backgroundColor: colors.brand },
  joinBtnText: { fontFamily: font.bold, fontSize: 13, color: '#06121f' },
  notesCard: { gap: 8 },
  notesLabel: { fontFamily: font.bold, fontSize: 13, color: colors.textMid, textAlign: 'right' },
  notesText: { fontFamily: font.regular, fontSize: 14, color: colors.textHi, textAlign: 'right', lineHeight: 22 },
  reminder: { padding: 14, backgroundColor: 'rgba(46,197,182,0.08)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(46,197,182,0.2)' },
  reminderText: { fontFamily: font.regular, fontSize: 13, color: colors.textMid, textAlign: 'right', lineHeight: 20 },
});
