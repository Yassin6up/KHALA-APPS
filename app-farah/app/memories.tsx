import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Play } from 'lucide-react-native';
import { MEMORY_TYPES } from '../src/data/farah';
import { colors, font, radii, spacing } from '../src/theme';

const RECENT = [
  { title: 'حفل زفاف أحمد ونورة', date: 'قبل أسبوع', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=700&q=80' },
  { title: 'تخرّج سارة', date: 'قبل شهر', image: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=700&q=80' },
];

export default function Memories() {
  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>عالم الذكريات</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroBadge, { backgroundColor: colors.purpleSoft }]}>
            <Text style={styles.heroBadgeText}>Memory Universe™</Text>
          </View>
          <Text style={styles.heroTitle}>نحوّل مناسبتك إلى ذكرى خالدة</Text>
          <Text style={styles.heroSub}>أفلام وألبومات وكتب رقمية يصنعها الذكاء الاصطناعي</Text>
        </View>

        {/* Memory types */}
        <Text style={styles.secTitle}>أنواع الذكريات</Text>
        <View style={styles.typeGrid}>
          {MEMORY_TYPES.map((m) => (
            <Pressable key={m.key} style={styles.typeCard}>
              <View style={[styles.typeIcon, { backgroundColor: m.tint + '18' }]}>
                <m.icon size={22} color={m.tint} />
              </View>
              <Text style={styles.typeTitle}>{m.title}</Text>
              <Text style={styles.typeDesc}>{m.desc}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent */}
        <Text style={styles.secTitle}>ذكرياتك الأخيرة</Text>
        <View style={{ gap: 10 }}>
          {RECENT.map((r) => (
            <Pressable key={r.title} style={styles.memCard}>
              <Image source={{ uri: r.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.75)']} style={StyleSheet.absoluteFill} />
              <View style={styles.playBtn}>
                <Play size={20} color={colors.brand2} fill={colors.brand2} />
              </View>
              <View style={styles.memInfo}>
                <Text style={styles.memTitle}>{r.title}</Text>
                <Text style={styles.memDate}>{r.date}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder,
  },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.lg },
  hero: {
    backgroundColor: colors.purpleSoft, borderRadius: radii.md,
    padding: spacing.lg, gap: 6, marginBottom: spacing.md,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)',
  },
  heroBadge: { alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  heroBadgeText: { fontFamily: font.medium, fontSize: 11, color: colors.brand2 },
  heroTitle: { fontFamily: font.bold, fontSize: 19, color: colors.textHi, textAlign: 'right', marginTop: 2 },
  heroSub: { fontFamily: font.regular, fontSize: 13, color: colors.textMid, textAlign: 'right', lineHeight: 20 },
  secTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi, textAlign: 'right', marginBottom: spacing.md, marginTop: spacing.md },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  typeCard: {
    flexBasis: '47%', flexGrow: 1, backgroundColor: '#fff',
    borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder, gap: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  typeIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  typeTitle: { fontFamily: font.bold, fontSize: 14.5, color: colors.textHi, textAlign: 'right' },
  typeDesc: { fontFamily: font.regular, fontSize: 11.5, color: colors.textMid, textAlign: 'right', lineHeight: 17 },
  memCard: { height: 155, borderRadius: radii.md, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  playBtn: {
    width: 52, height: 52, borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center',
  },
  memInfo: { position: 'absolute', bottom: 0, right: 0, left: 0, padding: spacing.md },
  memTitle: { fontFamily: font.bold, fontSize: 15.5, color: '#fff', textAlign: 'right' },
  memDate: { fontFamily: font.regular, fontSize: 11.5, color: 'rgba(255,255,255,0.82)', textAlign: 'right', marginTop: 2 },
});
