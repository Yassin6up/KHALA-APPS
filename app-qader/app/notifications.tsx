import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight, Bell, CalendarDays, BookOpen, CheckCheck, Video,
} from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { colors, font, spacing } from '../src/theme';

type Notif = {
  id: string; type: string; titleAr: string; bodyAr: string; isRead: boolean; createdAt: string; dataJson?: any;
};

const TYPE_ICON: Record<string, { icon: React.FC<any>; color: string }> = {
  session_booked:   { icon: CalendarDays, color: '#A855F7' },
  session_reminder: { icon: Video,        color: '#2EC5B6' },
  new_content:      { icon: BookOpen,     color: '#3B82F6' },
  general:          { icon: Bell,         color: '#F59E0B' },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `منذ ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `منذ ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `منذ ${days} يوم`;
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Notif[]>('/me/notifications').then(setNotifs).catch(() => []).finally(() => setLoading(false));
  }, []);

  const unread = notifs.filter((n) => !n.isRead).length;

  async function markAllRead() {
    await api('/me/notifications/read-all', { method: 'PATCH' }).catch(() => null);
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function openSession(n: Notif) {
    const sid = n.dataJson?.sessionId;
    if (sid) router.push(`/consult/session/${sid}` as never);
  }

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowRight size={22} color={colors.textMid} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>الإشعارات</Text>
            {unread > 0 && <Text style={styles.unreadCount}>{unread} إشعار غير مقروء</Text>}
          </View>
          {unread > 0 && (
            <Pressable onPress={markAllRead} style={styles.readAllBtn}>
              <CheckCheck size={15} color={colors.brand} />
              <Text style={styles.readAllText}>تحديد الكل مقروءاً</Text>
            </Pressable>
          )}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={{ marginTop: 60 }} />
        ) : notifs.length === 0 ? (
          <View style={styles.empty}>
            <Bell size={36} color={colors.textLo} />
            <Text style={styles.emptyText}>لا توجد إشعارات بعد</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {notifs.map((n) => {
              const tInfo = TYPE_ICON[n.type] ?? TYPE_ICON.general;
              const isSession = n.type === 'session_booked' || n.type === 'session_reminder';
              return (
                <Pressable key={n.id} onPress={() => isSession ? openSession(n) : undefined}>
                  <GlassCard style={[styles.card, !n.isRead && styles.unreadCard]}>
                    <View style={[styles.iconWrap, { backgroundColor: tInfo.color + '18' }]}>
                      <tInfo.icon size={22} color={tInfo.color} />
                      {!n.isRead && <View style={styles.dot} />}
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={styles.titleRow}>
                        <Text style={styles.time}>{relativeTime(n.createdAt)}</Text>
                        <Text style={styles.title}>{n.titleAr}</Text>
                      </View>
                      <Text style={styles.body}>{n.bodyAr}</Text>
                    </View>
                  </GlassCard>
                </Pressable>
              );
            })}
            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'right' },
  unreadCount: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right' },
  readAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, backgroundColor: 'rgba(46,197,182,0.1)', borderWidth: 1, borderColor: 'rgba(46,197,182,0.3)' },
  readAllText: { fontFamily: font.medium, fontSize: 12, color: colors.brand },
  list: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  empty: { alignItems: 'center', gap: 12, paddingVertical: 60 },
  emptyText: { fontFamily: font.regular, fontSize: 15, color: colors.textLo },
  card: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  unreadCard: { borderColor: 'rgba(46,197,182,0.3)', backgroundColor: 'rgba(46,197,182,0.04)' },
  iconWrap: { position: 'relative', flexShrink: 0, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  dot: { position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 10, backgroundColor: colors.brand, borderWidth: 2, borderColor: colors.bg0 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  time: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  body: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', lineHeight: 20 },
});
