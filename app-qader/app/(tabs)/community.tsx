import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
import { colors, font, radii, spacing, type } from '../../src/theme';
import { Flame, Users, PenLine, MessageCircle } from 'lucide-react-native';

type Room = { id: string; nameAr: string; type: string; imageUrl?: string | null; memberCount: number; messageCount: number };

function toArabicNumber(n: number): string {
  return n.toString().replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[+d]);
}

export default function Community() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Room[]>('/community/rooms')
      .then(setRooms)
      .catch(() => [])
      .finally(() => setLoading(false));
  }, []);

  async function joinRoom(room: Room) {
    try { await api(`/community/rooms/${room.id}/join`, { method: 'POST' }); } catch {}
    router.push(`/community/${room.id}` as never);
  }

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[type.h1, { textAlign: 'right' }]}>المجتمع</Text>
          <Text style={[type.body, { textAlign: 'right', color: colors.textLo, marginTop: 4 }]}>
            شارك خبراتك وتعلّم من الآخرين
          </Text>
        </View>

        {/* Trending banner */}
        <GlassCard style={styles.banner} intensity={50}>
          <Flame size={32} color="#FF6B6B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>الأكثر نشاطاً الآن</Text>
            <Text style={styles.bannerSub}>انضم إلى النقاش وشارك أفكارك</Text>
          </View>
        </GlassCard>

        <Text style={[type.h2, { textAlign: 'right' }]}>الغرف المتاحة</Text>

        {loading ? (
          [1, 2, 3].map((i) => <GlassCard key={i} style={styles.skeletonCard}><View style={styles.skeleton} /></GlassCard>)
        ) : (
          rooms.map((room, index) => {
            return (
            <GlassCard key={room.id} style={styles.roomCard}>
              <View style={styles.avatarWrap}>
                <Image
                  source={{ uri: room.imageUrl || 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=200&q=80' }}
                  style={styles.avatarImage}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.roomName}>{room.nameAr}</Text>
                <View style={{ flexDirection: 'row', gap: 12, justifyContent: 'flex-end', alignItems: 'center' }}>
                  <Text style={styles.meta}>{toArabicNumber(room.messageCount)} رسالة</Text>
                  <Users size={12} color={colors.textLo} />
                  <Text style={styles.meta}>{toArabicNumber(room.memberCount + Math.floor(Math.random() * 200 + 100))}</Text>
                </View>
              </View>
              <Pressable onPress={() => joinRoom(room)} style={styles.joinBtn}>
                <Text style={styles.joinText}>دخول</Text>
              </Pressable>
            </GlassCard>
            );
          })
        )}

        {/* Post prompt */}
        <GlassCard style={styles.postCard}>
          <PenLine size={24} color={colors.textHi} />
          <View style={{ flex: 1 }}>
            <Text style={styles.postTitle}>شارك فكرة أو سؤال</Text>
            <Text style={styles.postSub}>ادخل أي غرفة وابدأ النقاش</Text>
          </View>
        </GlassCard>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  header: { marginTop: spacing.sm, marginBottom: spacing.sm },
  banner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  bannerTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right' },
  bannerSub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', marginTop: 2 },
  skeletonCard: { height: 76 },
  skeleton: { height: 16, borderRadius: 8, backgroundColor: colors.glassFillStrong, margin: spacing.sm },
  roomCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarWrap: { width: 52, height: 52, borderRadius: radii.sm, overflow: 'hidden', flexShrink: 0 },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  roomName: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  meta: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  joinBtn: { backgroundColor: colors.brand, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  joinText: { fontFamily: font.bold, fontSize: 13, color: '#06121f' },
  postCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.brand, borderWidth: 1 },
  postTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  postSub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', marginTop: 2 },
});
