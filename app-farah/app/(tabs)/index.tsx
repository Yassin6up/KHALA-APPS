import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, Search, Sparkles, Gift, Film, ChevronLeft, Crown } from 'lucide-react-native';
import { GradientBackground } from '../../src/components/GradientBackground';
import { OCCASIONS, AI_FEATURES } from '../../src/data/farah';
import { colors, font, radii, spacing } from '../../src/theme';

const SUGGESTED = [
  { title: 'حفل زفاف فاخر', tag: 'الأكثر طلباً', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=700&q=80' },
  { title: 'استقبال حجّاج', tag: 'موسمي', image: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=700&q=80' },
  { title: 'عيد ميلاد', tag: 'مرح', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=700&q=80' },
];

export default function Home() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>أهلاً بك في</Text>
            <Text style={styles.brand}>فرح <Text style={{ color: colors.brand }}>AI</Text></Text>
          </View>
          <Pressable onPress={() => router.push('/subscription')} style={styles.vipBtn}>
            <Crown size={14} color="#B45309" />
            <Text style={styles.vipText}>VIP</Text>
          </Pressable>
          <Pressable style={styles.iconBtn}>
            <Bell size={19} color={colors.textHi} />
            <View style={styles.dot} />
          </Pressable>
        </View>

        {/* Search */}
        <Pressable onPress={() => router.push('/(tabs)/marketplace')} style={styles.search}>
          <Search size={18} color={colors.textLo} />
          <Text style={styles.searchText}>ابحث عن خدمات أو مناسبات...</Text>
        </Pressable>

        {/* Hero */}
        <Pressable onPress={() => router.push('/(tabs)/occasions')} style={styles.hero}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&q=80' }}
            style={StyleSheet.absoluteFill} resizeMode="cover"
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroBadge}>
            <Sparkles size={12} color="#fff" />
            <Text style={styles.heroBadgeText}>مدعوم بالذكاء الاصطناعي</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>دعنا نخطّط لمناسبتك القادمة</Text>
            <Text style={styles.heroSub}>من الفكرة إلى التنفيذ خلال دقائق</Text>
            <View style={styles.heroCta}>
              <Text style={styles.heroCtaText}>ابدأ التخطيط</Text>
              <ChevronLeft size={15} color={colors.brand} />
            </View>
          </View>
        </Pressable>

        {/* Occasions */}
        <SectionHead title="تصفّح حسب المناسبة" onPress={() => router.push('/(tabs)/occasions')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hStrip}>
          {OCCASIONS.slice(0, 8).map((o) => (
            <Pressable key={o.key} onPress={() => router.push(`/occasion/${o.key}` as never)} style={styles.occCard}>
              <Image source={{ uri: o.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
              <View style={[styles.occIcon, { backgroundColor: o.tint }]}>
                <o.icon size={14} color="#fff" />
              </View>
              <Text style={styles.occTitle} numberOfLines={2}>{o.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* AI features */}
        <SectionHead title="ذكاء فرح الاصطناعي" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hStrip}>
          {AI_FEATURES.map((f) => (
            <View key={f.key} style={styles.aiCard}>
              <LinearGradient colors={f.gradient} style={styles.aiIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <f.icon size={20} color="#fff" />
              </LinearGradient>
              <Text style={styles.aiTitle}>{f.title}</Text>
              <Text style={styles.aiTm}>{f.trademark}</Text>
              <Text style={styles.aiDesc} numberOfLines={3}>{f.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Suggested */}
        <SectionHead title="مناسبات مقترحة" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hStrip}>
          {SUGGESTED.map((s) => (
            <Pressable key={s.title} style={styles.sugCard}>
              <Image source={{ uri: s.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
              <View style={styles.sugTag}><Text style={styles.sugTagText}>{s.tag}</Text></View>
              <Text style={styles.sugTitle}>{s.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Feature banners */}
        <View style={styles.banners}>
          <Pressable onPress={() => router.push('/gifts')} style={styles.bannerCard}>
            <LinearGradient colors={[colors.brand, '#C026D3']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.bannerIcon}><Gift size={22} color="#fff" /></View>
            <Text style={styles.bannerTitle}>الهدايا الذكية</Text>
            <Text style={styles.bannerSub}>اختر وأرسل بسهولة</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/memories')} style={styles.bannerCard}>
            <LinearGradient colors={[colors.brand2, '#A855F7']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.bannerIcon}><Film size={22} color="#fff" /></View>
            <Text style={styles.bannerTitle}>عالم الذكريات</Text>
            <Text style={styles.bannerSub}>ذكرى خالدة دائماً</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </GradientBackground>
  );
}

function SectionHead({ title, onPress }: { title: string; onPress?: () => void }) {
  return (
    <View style={styles.secHead}>
      {onPress ? (
        <Pressable onPress={onPress} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Text style={styles.secMore}>الكل</Text>
          <ChevronLeft size={14} color={colors.brand} />
        </Pressable>
      ) : <View />}
      <Text style={styles.secTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.lg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginBottom: spacing.md,
  },
  greeting: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right' },
  brand: { fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'right' },
  vipBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.goldSoft, borderRadius: 999,
    paddingHorizontal: 12, height: 34,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)',
  },
  vipText: { fontFamily: font.bold, fontSize: 12, color: '#B45309' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  dot: {
    position: 'absolute', top: 9, right: 10,
    width: 7, height: 7, borderRadius: 7,
    backgroundColor: colors.brand, borderWidth: 1.5, borderColor: '#fff',
  },
  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: spacing.lg, backgroundColor: colors.bg1,
    borderRadius: radii.pill, paddingHorizontal: 18, height: 48,
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: spacing.md,
  },
  searchText: { fontFamily: font.regular, fontSize: 13.5, color: colors.textLo },

  hero: {
    marginHorizontal: spacing.lg, height: 190, borderRadius: radii.lg,
    overflow: 'hidden', justifyContent: 'flex-end',
  },
  heroBadge: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroBadgeText: { fontFamily: font.medium, fontSize: 11, color: '#fff' },
  heroContent: { padding: spacing.md, gap: 5 },
  heroTitle: { fontFamily: font.bold, fontSize: 20, color: '#fff', textAlign: 'right' },
  heroSub: { fontFamily: font.regular, fontSize: 13, color: 'rgba(255,255,255,0.88)', textAlign: 'right' },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    alignSelf: 'flex-end', backgroundColor: '#fff',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 4,
  },
  heroCtaText: { fontFamily: font.bold, fontSize: 13, color: colors.brand },

  secHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm,
  },
  secTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  secMore: { fontFamily: font.medium, fontSize: 12.5, color: colors.brand },

  hStrip: { paddingHorizontal: spacing.lg, gap: 10 },
  occCard: { width: 110, height: 140, borderRadius: radii.md, overflow: 'hidden', justifyContent: 'flex-end' },
  occIcon: {
    position: 'absolute', top: 10, right: 10,
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  occTitle: { fontFamily: font.bold, fontSize: 12.5, color: '#fff', textAlign: 'right', padding: 9 },

  aiCard: {
    width: 190, backgroundColor: '#FFFFFF',
    borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder, gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  aiIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: font.bold, fontSize: 14.5, color: colors.textHi, textAlign: 'right', marginTop: 2 },
  aiTm: { fontFamily: font.medium, fontSize: 10, color: colors.brand, textAlign: 'right' },
  aiDesc: { fontFamily: font.regular, fontSize: 11.5, color: colors.textMid, textAlign: 'right', lineHeight: 18 },

  sugCard: { width: 185, height: 125, borderRadius: radii.md, overflow: 'hidden', justifyContent: 'flex-end' },
  sugTag: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: colors.gold, borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  sugTagText: { fontFamily: font.bold, fontSize: 10, color: '#3A2606' },
  sugTitle: { fontFamily: font.bold, fontSize: 14.5, color: '#fff', textAlign: 'right', padding: 11 },

  banners: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  bannerCard: {
    flex: 1, height: 140, borderRadius: radii.md, overflow: 'hidden',
    padding: spacing.md, justifyContent: 'flex-end', gap: 3,
  },
  bannerIcon: {
    position: 'absolute', top: 14, right: 14,
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  bannerTitle: { fontFamily: font.bold, fontSize: 15, color: '#fff', textAlign: 'right' },
  bannerSub: { fontFamily: font.regular, fontSize: 11, color: 'rgba(255,255,255,0.88)', textAlign: 'right' },
});
