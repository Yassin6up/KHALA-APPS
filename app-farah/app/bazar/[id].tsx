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

type BazarItemDetails = {
  id: string;
  titleAr: string;
  descAr: string;
  type: string;
  priceMinor: number;
  coverUrl: string;
  creator: {
    fullName: string;
    faceImageUrl: string;
  };
};

export default function BazarItemDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<BazarItemDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<BazarItemDetails>(`/bazar/${id}`)
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
        <Text style={[type.body, { textAlign: 'center', marginTop: spacing.xl }]}>لم يتم العثور على العرض</Text>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header title="التفاصيل" />
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        
        <Image source={{ uri: data.coverUrl }} style={styles.coverImage} />

        <GlassCard style={styles.content}>
          <Text style={styles.typeBadge}>{data.type === 'product' ? 'منتج' : data.type === 'service' ? 'خدمة' : 'إيجار'}</Text>
          <Text style={type.h2}>{data.titleAr}</Text>
          <Text style={styles.price}>{(data.priceMinor / 1000).toFixed(0)} ر.ع</Text>

          <View style={styles.divider} />

          <Text style={type.h3}>التفاصيل</Text>
          <Text style={[type.body, { color: colors.textMid, lineHeight: 24 }]}>{data.descAr}</Text>

          <View style={styles.divider} />

          <Text style={type.h3}>صانع المحتوى</Text>
          <View style={styles.creatorRow}>
            <Image source={{ uri: data.creator?.faceImageUrl || 'https://via.placeholder.com/50' }} style={styles.creatorImage} />
            <Text style={[type.body, { fontFamily: font.bold }]}>{data.creator?.fullName || 'غير معروف'}</Text>
          </View>
        </GlassCard>

        <Pressable style={styles.checkoutBtn} onPress={() => router.push(`/bazar/checkout/${data.id}`)}>
          <Text style={styles.checkoutBtnText}>إتمام الطلب (Checkout)</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md },
  coverImage: { width: '100%', height: 250, borderRadius: radii.lg, backgroundColor: colors.glassFillStrong },
  content: { padding: spacing.md, gap: spacing.sm },
  typeBadge: { alignSelf: 'flex-start', fontFamily: font.regular, fontSize: 12, color: colors.brand, backgroundColor: 'rgba(46,197,182,0.1)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 4 },
  price: { fontFamily: font.bold, fontSize: 24, color: colors.brand },
  divider: { height: 1, backgroundColor: colors.glassBorder, marginVertical: spacing.sm },
  creatorRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  creatorImage: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.glassFillStrong },
  checkoutBtn: { backgroundColor: colors.brand, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.md },
  checkoutBtnText: { fontFamily: font.bold, color: '#fff', fontSize: 16 },
});
