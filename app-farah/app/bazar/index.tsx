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
import { colors, font, radii, spacing, type } from '../../src/theme';
import { Plus } from 'lucide-react-native';

type BazarItem = {
  id: string;
  titleAr: string;
  type: string;
  priceMinor: number;
  coverUrl: string;
};

export default function Bazar() {
  const [items, setItems] = useState<BazarItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<BazarItem[]>('/bazar')
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  return (
    <GradientBackground>
      <Header title="سوق المبدعين" />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/bazar/${item.id}`)}>
              <GlassCard style={styles.card}>
                <Image source={{ uri: item.coverUrl || 'https://images.unsplash.com/photo-1555617112-92fc9e36511a?w=400&q=80' }} style={styles.image} />
                <View style={styles.content}>
                  <Text style={styles.title} numberOfLines={2}>{item.titleAr}</Text>
                  <View style={styles.row}>
                    <Text style={styles.typeBadge}>{item.type === 'product' ? 'منتج' : item.type === 'service' ? 'خدمة' : 'تأجير'}</Text>
                    <Text style={styles.price}>{(item.priceMinor / 1000).toFixed(0)} ر.ع</Text>
                  </View>
                </View>
              </GlassCard>
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <Text style={[type.body, { textAlign: 'center', marginTop: spacing.xl, color: colors.textLo }]}>
              لا توجد معروضات حالياً
            </Text>
          )}
        />
      )}

      <Pressable style={styles.fab} onPress={() => router.push('/bazar/create')}>
        <Plus color="#fff" size={24} />
      </Pressable>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: 100 },
  card: { flexDirection: 'row', padding: spacing.sm, gap: spacing.md, alignItems: 'center' },
  image: { width: 80, height: 80, borderRadius: radii.md, backgroundColor: colors.glassFillStrong },
  content: { flex: 1, gap: 8 },
  title: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: { fontFamily: font.regular, fontSize: 10, color: colors.brand, backgroundColor: 'rgba(46,197,182,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  price: { fontFamily: font.bold, fontSize: 14, color: colors.brand },
  fab: { position: 'absolute', bottom: spacing.xl, right: spacing.xl, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84 },
});
