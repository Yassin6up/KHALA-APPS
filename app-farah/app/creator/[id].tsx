import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { Header } from '../../src/components/Header';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../src/theme';
import { Star, Calendar, MessageCircle } from 'lucide-react-native';

type CreatorDetails = {
  id: string;
  fullName: string;
  faceImageUrl: string;
  bioAr: string;
  rating: number;
  reviewCount: number;
  priceMinor: number;
  availableDatesJson: string | { text: string };
  posts: any[];
};

export default function CreatorProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<CreatorDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CreatorDetails>(`/creators/${id}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <GradientBackground>
        <Header title="" />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      </GradientBackground>
    );
  }

  if (!data) {
    return (
      <GradientBackground>
        <Header title="" />
        <Text style={[type.body, { textAlign: 'center', marginTop: spacing.xl }]}>لم يتم العثور على صانع المحتوى</Text>
      </GradientBackground>
    );
  }

  const availableDates = typeof data.availableDatesJson === 'string' 
    ? data.availableDatesJson 
    : (data.availableDatesJson as any)?.text || '';

  return (
    <GradientBackground>
      <Header title={data.fullName} />
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        
        <GlassCard style={styles.topCard}>
          <Image source={{ uri: data.faceImageUrl }} style={styles.avatar} />
          <Text style={type.h2}>{data.fullName}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Star size={20} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.statText}>{data.rating.toFixed(1)} ({data.reviewCount} تقييم)</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statText, { color: colors.brand, fontFamily: font.bold }]}>
                يبدأ من {(data.priceMinor / 1000).toFixed(0)} ر.ع
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={type.h3}>نبذة عني</Text>
          <Text style={[type.body, { color: colors.textMid, lineHeight: 24, marginTop: spacing.sm }]}>
            {data.bioAr}
          </Text>
        </GlassCard>

        <GlassCard style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.sm }}>
            <Calendar size={20} color={colors.brand} />
            <Text style={type.h3}>أيام التوفر</Text>
          </View>
          <Text style={[type.body, { color: colors.textMid }]}>{availableDates}</Text>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Text style={type.h3}>أعمالي وخدماتي ({data.posts.length})</Text>
        </View>

        <View style={styles.postsGrid}>
          {data.posts.map(post => (
            <Pressable key={post.id} style={styles.postCard} onPress={() => router.push(`/bazar/${post.id}`)}>
              <Image source={{ uri: post.coverUrl }} style={styles.postImage} />
              <View style={styles.postContent}>
                <Text style={styles.postTitle} numberOfLines={2}>{post.titleAr}</Text>
                <Text style={styles.postPrice}>{(post.priceMinor / 1000).toFixed(0)} ر.ع</Text>
              </View>
            </Pressable>
          ))}
          {data.posts.length === 0 && (
            <Text style={[type.body, { color: colors.textLo, textAlign: 'center', flex: 1, marginTop: spacing.md }]}>
              لا توجد خدمات حالياً
            </Text>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md },
  topCard: { alignItems: 'center', gap: spacing.sm, paddingTop: spacing.xl },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.glassFillStrong, marginBottom: spacing.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md },
  statDivider: { width: 1, height: 20, backgroundColor: colors.glassBorder },
  statText: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  section: { padding: spacing.md },
  sectionHeader: { marginTop: spacing.sm },
  postsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  postCard: { width: '48%', backgroundColor: colors.glassFill, borderRadius: radii.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  postImage: { width: '100%', height: 120, backgroundColor: colors.glassFillStrong },
  postContent: { padding: spacing.sm, gap: 4 },
  postTitle: { fontFamily: font.medium, fontSize: 13, color: colors.textHi },
  postPrice: { fontFamily: font.bold, fontSize: 14, color: colors.brand },
});
