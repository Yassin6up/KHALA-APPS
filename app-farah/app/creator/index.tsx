import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { Header } from '../../src/components/Header';
import { api } from '../../src/lib/api';
import { colors, font, spacing, type } from '../../src/theme';
import { Star } from 'lucide-react-native';

type Creator = {
  id: string;
  fullName: string;
  faceImageUrl: string;
  rating: number;
  reviewCount: number;
  priceMinor: number;
};

export default function CreatorDirectory() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Creator[]>('/creators')
      .then(setCreators)
      .finally(() => setLoading(false));
  }, []);

  return (
    <GradientBackground>
      <Header title="دليل المبدعين" />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={creators}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm }}
          renderItem={({ item }) => (
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/creator/${item.id}`)}>
              <GlassCard style={styles.card}>
                <Image
                  source={{ uri: item.faceImageUrl || 'https://via.placeholder.com/150' }}
                  style={styles.image}
                />
                <Text style={styles.name} numberOfLines={1}>{item.fullName}</Text>
                
                <View style={styles.row}>
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.rating}>{item.rating.toFixed(1)} ({item.reviewCount})</Text>
                </View>
                
                <Text style={styles.price}>
                  تبدأ من {(item.priceMinor / 1000).toFixed(0)} ر.ع
                </Text>
              </GlassCard>
            </Pressable>
          )}
        />
      )}
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.sm },
  card: { alignItems: 'center', padding: spacing.md, gap: 8 },
  image: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.glassFillStrong },
  name: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rating: { fontFamily: font.regular, fontSize: 12, color: colors.textMid },
  price: { fontFamily: font.bold, fontSize: 12, color: colors.brand },
});
