import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { GradientBackground } from '../../src/components/GradientBackground';
import { OCCASIONS, AI_FEATURES } from '../../src/data/farah';
import { colors, font, radii, spacing } from '../../src/theme';

export default function Occasions() {
  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>المناسبات</Text>
          <Text style={styles.sub}>اختر نوع مناسبتك ودع الذكاء الاصطناعي يخطّط لك</Text>
        </View>

        {/* Occasions grid */}
        <View style={styles.grid}>
          {OCCASIONS.map((o) => (
            <Pressable key={o.key} onPress={() => router.push(`/occasion/${o.key}` as never)} style={styles.card}>
              <Image source={{ uri: o.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={StyleSheet.absoluteFill} />
              <View style={[styles.cardIcon, { backgroundColor: o.tint }]}>
                <o.icon size={15} color="#fff" />
              </View>
              <Text style={styles.cardTitle}>{o.title}</Text>
            </Pressable>
          ))}
        </View>

        {/* AI features */}
        <Text style={styles.secTitle}>أدوات الذكاء الاصطناعي</Text>
        <View style={{ gap: 10, paddingHorizontal: spacing.lg }}>
          {AI_FEATURES.map((f) => (
            <Pressable key={f.key} onPress={() => router.push(f.route as never)} style={styles.aiRow}>
              <ChevronLeft size={17} color={colors.textLo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.aiTitle}>{f.title}</Text>
                <Text style={styles.aiTm}>{f.trademark}</Text>
                <Text style={styles.aiDesc} numberOfLines={2}>{f.desc}</Text>
              </View>
              <LinearGradient colors={f.gradient} style={styles.aiIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <f.icon size={20} color="#fff" />
              </LinearGradient>
            </Pressable>
          ))}
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
  sub: { fontFamily: font.regular, fontSize: 13.5, color: colors.textMid, textAlign: 'right', marginTop: 4, lineHeight: 21 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: spacing.lg },
  card: { flexBasis: '47%', flexGrow: 1, height: 128, borderRadius: radii.md, overflow: 'hidden', justifyContent: 'flex-end' },
  cardIcon: { position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: font.bold, fontSize: 13, color: '#fff', textAlign: 'right', padding: 10 },
  secTitle: {
    fontFamily: font.bold, fontSize: 18, color: colors.textHi,
    textAlign: 'right', paddingHorizontal: spacing.lg,
    marginTop: spacing.xl, marginBottom: spacing.md,
  },
  aiRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  aiIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  aiTm: { fontFamily: font.medium, fontSize: 10.5, color: colors.brand, textAlign: 'right', marginTop: 1 },
  aiDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textMid, textAlign: 'right', marginTop: 3, lineHeight: 18 },
});
