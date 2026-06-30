import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Search, Star, Users as UsersIcon } from 'lucide-react-native';
import { GradientBackground } from '../../src/components/GradientBackground';
import { MARKET_CATS } from '../../src/data/farah';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

const BASE = 'http://192.168.2.161:4000';

type Vendor = {
  id: string; type: string; section: string; titleAr: string; descAr: string | null;
  coverUrl: string | null; priceMinor: number; currency: string; capacity: number | null;
};

const SECTION_TINT: Record<string, string> = {
  venues: '#E8488B', photography: '#0EA5E9', decor: '#F5B301',
  catering: '#10B981', gifts: '#EC4899', production: '#8B5CF6',
};

export default function Marketplace() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [active, setActive] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Vendor[]>('/catalog').then(setVendors).catch(() => null).finally(() => setLoading(false));
  }, []);

  const filtered = active === 'all' ? vendors : vendors.filter((v) => v.section === active);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>سوق فرح</Text>
          <Text style={styles.sub}>كل خدمات المناسبات في مكان واحد</Text>
        </View>

        {/* Search */}
        <View style={styles.search}>
          <Search size={18} color={colors.textLo} />
          <Text style={styles.searchText}>ابحث عن قاعة، مصوّر، ديكور...</Text>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable onPress={() => setActive('all')} style={[styles.chip, active === 'all' && styles.chipActive]}>
            <Text style={[styles.chipText, active === 'all' && styles.chipTextActive]}>الكل</Text>
          </Pressable>
          {MARKET_CATS.filter((c) => c.key !== 'more').map((c) => (
            <Pressable key={c.key} onPress={() => setActive(c.key)}
              style={[styles.chip, active === c.key && styles.chipActive]}>
              <c.icon size={14} color={active === c.key ? '#fff' : c.tint} />
              <Text style={[styles.chipText, active === c.key && styles.chipTextActive]}>{c.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Vendor list */}
        <View style={{ gap: 10, paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
          {loading ? (
            <Text style={styles.empty}>جارٍ التحميل…</Text>
          ) : filtered.length === 0 ? (
            <Text style={styles.empty}>لا توجد نتائج في هذه الفئة</Text>
          ) : filtered.map((v) => {
            const tint = SECTION_TINT[v.section] ?? colors.brand;
            const coverUri = v.coverUrl?.startsWith('http') ? v.coverUrl : v.coverUrl ? `${BASE}/uploads/${v.coverUrl}` : null;
            return (
              <Pressable key={v.id} style={styles.card} onPress={() => router.push(`/vendor/${v.id}` as never)}>
                {coverUri ? (
                  <Image source={{ uri: coverUri }} style={styles.thumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.thumb, { backgroundColor: tint + '18', alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={[styles.thumbLetter, { color: tint }]}>{v.titleAr.charAt(0)}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{v.titleAr}</Text>
                  <Text style={styles.cardDesc} numberOfLines={2}>{v.descAr}</Text>
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Star size={12} color={colors.gold} fill={colors.gold} />
                      <Text style={styles.metaText}>4.8</Text>
                    </View>
                    {v.capacity && (
                      <View style={styles.metaItem}>
                        <UsersIcon size={12} color={colors.textLo} />
                        <Text style={styles.metaText}>{v.capacity}</Text>
                      </View>
                    )}
                    <Text style={styles.price}>{(v.priceMinor / 1000).toFixed(0)} ر.ع</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>

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
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.lg, backgroundColor: colors.bg1,
    borderRadius: radii.pill, paddingHorizontal: 18, height: 46,
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: spacing.md,
  },
  searchText: { fontFamily: font.regular, fontSize: 13.5, color: colors.textLo },
  chips: { paddingHorizontal: spacing.lg, gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', borderRadius: 999,
    paddingHorizontal: 14, height: 38,
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
  chipTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radii.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  thumb: { width: 58, height: 58, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  thumbLetter: { fontFamily: font.bold, fontSize: 24 },
  cardTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  cardDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textMid, textAlign: 'right', marginTop: 2, lineHeight: 18 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 7 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: font.medium, fontSize: 12, color: colors.textMid },
  price: { fontFamily: font.bold, fontSize: 13.5, color: colors.brand, marginLeft: 'auto' },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', paddingVertical: 40 },
});
