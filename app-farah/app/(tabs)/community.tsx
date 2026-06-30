import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Users as UsersIcon, MessageCircle, Sparkles } from 'lucide-react-native';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

type Room = {
  id: string; nameAr: string; type: string; imageUrl: string | null;
  memberCount: number; messageCount: number;
};

export default function Community() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Room[]>('/community/rooms').then(setRooms).catch(() => null).finally(() => setLoading(false));
  }, []);

  const communities = rooms.filter((r) => r.type !== 'cohort');
  const brotherhoods = rooms.filter((r) => r.type === 'cohort');

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>مجتمع فرح</Text>
          <Text style={styles.sub}>تواصل مع من يشاركونك الاهتمام بالمناسبات</Text>
        </View>

        {/* Featured banner */}
        <Pressable style={styles.featured}>
          <LinearGradient colors={[colors.brand2, colors.brand]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <View style={styles.featuredIcon}><Sparkles size={20} color="#fff" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.featuredTitle}>مجتمعات متخصصة</Text>
            <Text style={styles.featuredSub}>انضم وابنِ علاقات تدوم مدى الحياة</Text>
          </View>
        </Pressable>

        {loading ? (
          <Text style={styles.empty}>جارٍ التحميل…</Text>
        ) : (
          <>
            <Text style={styles.secTitle}>المجتمعات</Text>
            <View style={{ gap: 10, paddingHorizontal: spacing.lg }}>
              {communities.map((r) => (
                <Pressable key={r.id} onPress={() => router.push(`/room/${r.id}` as never)} style={styles.room}>
                  {r.imageUrl ? (
                    <Image source={{ uri: r.imageUrl }} style={styles.roomImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.roomImg, styles.roomImgPlaceholder]}>
                      <UsersIcon size={20} color={colors.brand} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.roomTitle}>{r.nameAr}</Text>
                    <View style={styles.roomMeta}>
                      <View style={styles.metaItem}><UsersIcon size={12} color={colors.textLo} /><Text style={styles.metaText}>{r.memberCount.toLocaleString('ar')}</Text></View>
                      <View style={styles.metaItem}><MessageCircle size={12} color={colors.textLo} /><Text style={styles.metaText}>{r.messageCount.toLocaleString('ar')}</Text></View>
                    </View>
                  </View>
                  <View style={styles.joinBtn}><Text style={styles.joinText}>انضم</Text></View>
                </Pressable>
              ))}
            </View>

            {brotherhoods.length > 0 && (
              <>
                <Text style={styles.secTitle}>نادي الأخويات</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hStrip}>
                  {brotherhoods.map((r) => (
                    <Pressable key={r.id} onPress={() => router.push(`/room/${r.id}` as never)} style={styles.broCard}>
                      {r.imageUrl && <Image source={{ uri: r.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />}
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
                      <Text style={styles.broTitle}>{r.nameAr}</Text>
                      <Text style={styles.broMeta}>{r.memberCount.toLocaleString('ar')} عضو</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  header: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  title: { fontFamily: font.bold, fontSize: 24, color: colors.textHi, textAlign: 'right' },
  sub: { fontFamily: font.regular, fontSize: 13.5, color: colors.textMid, textAlign: 'right', marginTop: 4 },
  featured: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: spacing.lg, borderRadius: radii.md,
    padding: spacing.md, overflow: 'hidden', marginBottom: spacing.md,
  },
  featuredIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  featuredTitle: { fontFamily: font.bold, fontSize: 16, color: '#fff', textAlign: 'right' },
  featuredSub: { fontFamily: font.regular, fontSize: 12, color: 'rgba(255,255,255,0.9)', textAlign: 'right', marginTop: 2 },
  secTitle: {
    fontFamily: font.bold, fontSize: 17, color: colors.textHi,
    textAlign: 'right', paddingHorizontal: spacing.lg,
    marginTop: spacing.lg, marginBottom: spacing.sm,
  },
  room: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radii.md,
    padding: spacing.sm + 4, borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  roomImg: { width: 52, height: 52, borderRadius: 14 },
  roomImgPlaceholder: { backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  roomTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  roomMeta: { flexDirection: 'row', gap: 12, marginTop: 5 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.medium, fontSize: 11.5, color: colors.textMid },
  joinBtn: {
    backgroundColor: colors.pinkSoft, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  joinText: { fontFamily: font.bold, fontSize: 12.5, color: colors.brand },
  hStrip: { paddingHorizontal: spacing.lg, gap: 10 },
  broCard: {
    width: 145, height: 105, borderRadius: radii.md,
    overflow: 'hidden', justifyContent: 'flex-end',
    padding: spacing.sm + 4, backgroundColor: colors.brand2,
  },
  broTitle: { fontFamily: font.bold, fontSize: 14, color: '#fff', textAlign: 'right' },
  broMeta: { fontFamily: font.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.88)', textAlign: 'right', marginTop: 2 },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 40 },
});
