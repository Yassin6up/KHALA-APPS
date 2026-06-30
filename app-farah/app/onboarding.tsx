import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Users, Gift, ArrowLeft } from 'lucide-react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, radii, spacing } from '../src/theme';

const BULLETS = [
  { icon: Sparkles, text: 'صمّم مناسبتك بالذكاء الاصطناعي' },
  { icon: Users, text: 'مجتمع يجمعك بمن يشاركك الاهتمام' },
  { icon: Gift, text: 'هدايا ذكية وذكريات تدوم للأبد' },
];

export default function Onboarding() {
  return (
    <View style={styles.root}>
      {/* Hero image */}
      <View style={styles.hero}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=900&q=80' }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <LinearGradient colors={['rgba(124,58,237,0.25)', 'rgba(232,72,139,0.55)', '#FFF6FB']} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.heroContent} edges={['top']}>
          <View style={styles.logoRow}>
            <LinearGradient colors={[colors.brand, colors.brand2]} style={styles.logoMark} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Gift size={22} color="#fff" />
            </LinearGradient>
            <Text style={styles.brandName}>فرح <Text style={{ color: colors.gold }}>AI</Text></Text>
          </View>
        </SafeAreaView>
      </View>

      {/* Sheet */}
      <SafeAreaView style={styles.sheet} edges={['bottom']}>
        <Text style={styles.title}>كل مناسبة تستحق أن تصبح ذكرى خالدة</Text>
        <Text style={styles.subtitle}>أول منصة ذكية متكاملة لإدارة المناسبات وبناء المجتمعات</Text>

        <View style={styles.bullets}>
          {BULLETS.map((b) => (
            <View key={b.text} style={styles.bullet}>
              <View style={styles.bulletIcon}><b.icon size={18} color={colors.brand} /></View>
              <Text style={styles.bulletText}>{b.text}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 12, marginTop: spacing.lg }}>
          <PrimaryButton label="ابدأ رحلتك" onPress={() => router.push('/login')} icon={<ArrowLeft size={18} color="#fff" />} />
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skip}>
            <Text style={styles.skipText}>استعراض بدون حساب</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg0 },
  hero: { height: '52%' },
  heroContent: { padding: spacing.lg },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { fontFamily: font.bold, fontSize: 22, color: '#fff' },
  sheet: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md, marginTop: -28 },
  title: { fontFamily: font.bold, fontSize: 26, color: colors.textHi, textAlign: 'center', lineHeight: 40 },
  subtitle: { fontFamily: font.regular, fontSize: 14.5, color: colors.textMid, textAlign: 'center', marginTop: 8, lineHeight: 24 },
  bullets: { gap: 12, marginTop: spacing.lg },
  bullet: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  bulletIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  bulletText: { fontFamily: font.medium, fontSize: 15, color: colors.textHi },
  skip: { alignItems: 'center', paddingVertical: 12 },
  skipText: { fontFamily: font.medium, color: colors.textLo, fontSize: 14 },
});
