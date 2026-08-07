import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Crown, CalendarHeart, Gift, Settings, ChevronLeft,
  LogIn, LogOut, Award, ShoppingBag, Film,
} from 'lucide-react-native';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';

const BASE = 'http://192.168.2.161:4000';

type Me = { user: { fullName?: string; email?: string; avatarUrl?: string }; subscription: { plan: { nameAr: string } } | null };
type Badge = { code: string; nameAr: string; iconUrl: string | null; earned: boolean };
type Achievements = { badges: Badge[]; points: number };
type Stats = { orders: number; messages: number; earnedBadges: number };

const MENU = [
  { key: 'events', label: 'مناسباتي', icon: CalendarHeart, route: '/(tabs)/occasions' },
  { key: 'memories', label: 'ذكرياتي', icon: Film, route: '/memories' },
  { key: 'gifts', label: 'هداياي', icon: Gift, route: '/gifts' },
  { key: 'orders', label: 'طلباتي', icon: ShoppingBag, route: '/my-orders' },
  { key: 'vip', label: 'العضوية والاشتراك', icon: Crown, route: '/subscription' },
  { key: 'settings', label: 'الإعدادات', icon: Settings, route: '/settings' },
];

export default function Profile() {
  const [me, setMe] = useState<Me | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const loggedIn = authStore.isLoggedIn();

  useEffect(() => {
    if (!loggedIn) return;
    api<Me>('/me').then(setMe).catch(() => null);
    api<Achievements>('/me/achievements').then((a) => setBadges(a.badges ?? [])).catch(() => null);
    api<Stats>('/me/stats').then(setStats).catch(() => null);
  }, [loggedIn]);

  const name = me?.user?.fullName ?? 'ضيف فرح';
  const plan = me?.subscription?.plan?.nameAr;
  const initials = name.charAt(0);

  function logout() {
    Alert.alert('تسجيل الخروج', 'هل تريد الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => { await authStore.clear(); router.replace('/onboarding'); } },
    ]);
  }

  // Determine shown badges (up to 4, earned first)
  const shownBadges = [...badges].sort((a, b) => (b.earned ? 1 : 0) - (a.earned ? 1 : 0)).slice(0, 4);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + name block */}
        <View style={styles.profileBlock}>
          <View style={styles.avatarWrap}>
            {me?.user?.avatarUrl ? (
              <Image source={{ uri: me.user.avatarUrl }} style={styles.avatarImg} />
            ) : (
              <LinearGradient colors={[colors.brand, colors.brand2]} style={styles.avatarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
            )}
          </View>
          <Text style={styles.name}>{name}</Text>
          {plan ? (
            <View style={styles.vipPill}>
              <Crown size={12} color={colors.gold} />
              <Text style={styles.vipPillText}>{plan}</Text>
            </View>
          ) : (
            <Text style={styles.role}>{loggedIn ? 'عضو في فرح' : 'تصفّح كضيف'}</Text>
          )}
        </View>

        {/* Stats row */}
        <View style={styles.statsCard}>
          {[
            { icon: ShoppingBag, val: stats ? String(stats.orders ?? 0) : '–', label: 'طلبات', color: colors.brand },
            { icon: Award, val: String(badges.filter((b) => b.earned).length), label: 'أوسمة', color: colors.gold },
            { icon: CalendarHeart, val: stats ? String(stats.messages ?? 0) : '–', label: 'رسائل', color: colors.brand2 },
          ].map((s, i) => (
            <View key={s.label} style={[styles.stat, i > 0 && styles.statBorder]}>
              <View style={[styles.statIcon, { backgroundColor: s.color + '18' }]}>
                <s.icon size={16} color={s.color} />
              </View>
              <Text style={styles.statVal}>{s.val}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Pressable onPress={() => router.push('/achievements' as never)}><Text style={styles.sectionMore}>عرض الكل</Text></Pressable>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>أوسمتي</Text>
              <Award size={16} color={colors.gold} />
            </View>
          </View>
          <View style={styles.badgeRow}>
            {shownBadges.length > 0 ? shownBadges.map((b) => {
              const iconUri = b.iconUrl ? (b.iconUrl.startsWith('http') ? b.iconUrl : `${BASE}/uploads/${b.iconUrl}`) : null;
              return (
                <View key={b.code} style={styles.badge}>
                  <View style={[styles.badgeIcon, !b.earned && styles.badgeLocked]}>
                    {iconUri ? (
                      <Image source={{ uri: iconUri }} style={[styles.badgeImg, !b.earned && { opacity: 0.3 }]} resizeMode="contain" />
                    ) : (
                      <Text style={{ fontSize: 22, opacity: b.earned ? 1 : 0.3 }}>🏅</Text>
                    )}
                  </View>
                  <Text style={[styles.badgeLabel, !b.earned && { color: colors.textLo }]} numberOfLines={2}>{b.nameAr}</Text>
                </View>
              );
            }) : (
              // Placeholder badges when not loaded
              ['🎉', '📋', '🎁', '📸'].map((e, i) => (
                <View key={i} style={styles.badge}>
                  <View style={styles.badgeIcon}><Text style={{ fontSize: 22 }}>{e}</Text></View>
                  <Text style={styles.badgeLabel}>وسام {i + 1}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* VIP upsell */}
        {!plan && (
          <Pressable onPress={() => router.push('/subscription')} style={styles.upsell}>
            <LinearGradient colors={[colors.gold, colors.brand]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <Crown size={22} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.upsellTitle}>فرح بريميوم</Text>
              <Text style={styles.upsellSub}>ذكاء اصطناعي ومناسبات بلا حدود</Text>
            </View>
            <ChevronLeft size={18} color="#fff" />
          </Pressable>
        )}

        {/* Menu */}
        <View style={styles.menuList}>
          {MENU.map((m, i) => (
            <Pressable key={m.key} onPress={() => router.push(m.route as never)}
              style={[styles.menuRow, i < MENU.length - 1 && styles.menuRowBorder]}>
              <ChevronLeft size={17} color={colors.textLo} />
              <Text style={styles.menuLabel}>{m.label}</Text>
              <View style={styles.menuIcon}><m.icon size={17} color={colors.brand} /></View>
            </Pressable>
          ))}
        </View>

        {/* Auth */}
        <Pressable onPress={loggedIn ? logout : () => router.push('/login')} style={styles.authBtn}>
          {loggedIn ? <LogOut size={17} color={colors.danger} /> : <LogIn size={17} color={colors.brand} />}
          <Text style={[styles.authText, { color: loggedIn ? colors.danger : colors.brand }]}>
            {loggedIn ? 'تسجيل الخروج' : 'تسجيل الدخول'}
          </Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.lg },

  profileBlock: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: 8, marginBottom: spacing.md },
  avatarWrap: { width: 90, height: 90, borderRadius: 90, overflow: 'hidden', marginBottom: 4 },
  avatarGrad: { width: 90, height: 90, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 90, height: 90 },
  avatarText: { fontFamily: font.bold, fontSize: 38, color: '#fff' },
  name: { fontFamily: font.bold, fontSize: 22, color: colors.textHi },
  role: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  vipPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.goldSoft, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)',
  },
  vipPillText: { fontFamily: font.bold, fontSize: 12, color: '#92400E' },

  statsCard: {
    flexDirection: 'row', marginHorizontal: spacing.lg,
    backgroundColor: '#fff', borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
    marginBottom: spacing.md,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, gap: 4 },
  statBorder: { borderRightWidth: 1, borderRightColor: colors.glassBorder },
  statIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  statVal: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },

  section: {
    marginHorizontal: spacing.lg, backgroundColor: '#fff',
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder,
    padding: spacing.md, marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  sectionTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi },
  sectionMore: { fontFamily: font.medium, fontSize: 12, color: colors.brand },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  badge: { alignItems: 'center', gap: 6, width: 64 },
  badgeIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  badgeLocked: { backgroundColor: colors.bg2, borderStyle: 'dashed' },
  badgeImg: { width: 36, height: 36 },
  badgeLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textMid, textAlign: 'center' },

  upsell: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.lg, borderRadius: radii.md,
    padding: spacing.md, overflow: 'hidden', marginBottom: spacing.md,
  },
  upsellTitle: { fontFamily: font.bold, fontSize: 15, color: '#fff', textAlign: 'right' },
  upsellSub: { fontFamily: font.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.9)', textAlign: 'right', marginTop: 1 },

  menuList: {
    marginHorizontal: spacing.lg, backgroundColor: '#fff',
    borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder,
    marginBottom: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, height: 56 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  menuLabel: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },

  authBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: spacing.lg, height: 50,
    borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.glassBorder,
  },
  authText: { fontFamily: font.bold, fontSize: 14.5 },
});
