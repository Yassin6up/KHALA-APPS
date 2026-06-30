import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight, Sparkles, Palette, Music2, UtensilsCrossed, Clock, Wand2,
  TrendingDown, Check,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { OCCASIONS } from '../../src/data/farah';
import { colors, font, radii, spacing } from '../../src/theme';

const PLAN = {
  theme: 'أناقة وردية ذهبية',
  swatchColors: ['#E8488B', '#F5B301', '#7C3AED', '#FCE2EE'],
  sections: [
    { icon: Palette, title: 'الديكور والإضاءة', desc: 'طاولات بلمسات ذهبية، إضاءة دافئة، وممر أزهار وردية.' },
    { icon: Music2, title: 'الموسيقى', desc: 'قائمة موسيقية هادئة عند الاستقبال وإيقاع احتفالي للحفل.' },
    { icon: UtensilsCrossed, title: 'الضيافة', desc: 'بوفيه مفتوح + ركن حلويات + قهوة عربية للترحيب.' },
  ],
  program: [
    { t: '٦:٠٠ م', e: 'استقبال الضيوف' },
    { t: '٧:٠٠ م', e: 'دخول أصحاب المناسبة' },
    { t: '٨:٣٠ م', e: 'العشاء' },
    { t: '٩:٣٠ م', e: 'قطع الكيكة والاحتفال' },
  ],
};

export default function OccasionPlanner() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const occ = OCCASIONS.find((o) => o.key === key) ?? OCCASIONS[0];
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  function generate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 1400);
  }

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: occ.image }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.heroNav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <View style={[styles.heroIcon, { backgroundColor: occ.tint }]}>
            <occ.icon size={19} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{occ.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* AI Designer */}
        <GlassCard style={styles.promptCard}>
          <View style={styles.promptHead}>
            <Text style={styles.promptTm}>AI Event Designer™</Text>
            <View style={[styles.wandWrap, { backgroundColor: colors.brand }]}>
              <Wand2 size={17} color="#fff" />
            </View>
          </View>
          <Text style={styles.promptTitle}>صف مناسبتك ودع الذكاء يصممها</Text>
          <TextInput
            style={styles.input}
            placeholder="مثال: حفل بسيط وأنيق لـ ١٥٠ ضيف بميزانية متوسطة..."
            placeholderTextColor={colors.textLo}
            value={prompt}
            onChangeText={setPrompt}
            multiline
            textAlign="right"
          />
          <PrimaryButton
            label={generating ? 'جارٍ التصميم...' : 'صمّم مناسبتي'}
            onPress={generate}
            loading={generating}
            icon={!generating ? <Sparkles size={17} color="#fff" /> : undefined}
          />
        </GlassCard>

        {done && (
          <>
            {/* Result header */}
            <View style={styles.resultHead}>
              <View style={styles.doneBadge}>
                <Check size={12} color="#fff" />
                <Text style={styles.doneBadgeText}>تم التصميم</Text>
              </View>
              <Text style={styles.secTitle}>التصميم المقترح</Text>
            </View>

            {/* Color theme */}
            <GlassCard style={{ marginHorizontal: spacing.lg }}>
              <Text style={styles.themeName}>{PLAN.theme}</Text>
              <View style={styles.swatches}>
                {PLAN.swatchColors.map((c) => (
                  <View key={c} style={[styles.swatch, { backgroundColor: c }]} />
                ))}
              </View>
            </GlassCard>

            {/* Sections */}
            <View style={{ gap: 10, paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
              {PLAN.sections.map((s) => (
                <View key={s.title} style={styles.sectionRow}>
                  <View style={styles.sectionIconWrap}><s.icon size={19} color={colors.brand} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sectionTitle}>{s.title}</Text>
                    <Text style={styles.sectionDesc}>{s.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Budget */}
            <View style={styles.budgetRow}>
              <Text style={styles.budgetSave}>−٢٥٪</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.budgetTitle}>محسّن الميزانية</Text>
                <Text style={styles.budgetDesc}>وفّرنا لك ٢٥٪ باقتراح بدائل ذكية</Text>
              </View>
              <View style={styles.budgetIcon}><TrendingDown size={19} color={colors.success} /></View>
            </View>

            {/* Timeline */}
            <Text style={[styles.secTitle, { paddingHorizontal: spacing.lg, marginTop: spacing.lg, textAlign: 'right' }]}>البرنامج الزمني</Text>
            <GlassCard style={{ marginHorizontal: spacing.lg, gap: 0 }}>
              {PLAN.program.map((p, i) => (
                <View key={i} style={[styles.programRow, i > 0 && styles.programBorder]}>
                  <Text style={styles.programEvent}>{p.e}</Text>
                  <View style={styles.timePill}>
                    <Clock size={11} color={colors.brand} />
                    <Text style={styles.timeText}>{p.t}</Text>
                  </View>
                </View>
              ))}
            </GlassCard>

            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.lg }}>
              <PrimaryButton label="إنشاء هذه المناسبة" variant="gold" onPress={() => router.push('/subscription')} />
            </View>
          </>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 220, justifyContent: 'flex-end' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, padding: spacing.md },
  backBtn: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center',
  },
  heroContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: font.bold, fontSize: 24, color: '#fff' },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
  promptCard: { marginHorizontal: spacing.lg, gap: spacing.md },
  promptHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  promptTm: { fontFamily: font.bold, fontSize: 12.5, color: colors.brand },
  wandWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi, textAlign: 'right' },
  input: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: 12,
    padding: spacing.md, minHeight: 88,
    color: colors.textHi, fontFamily: font.regular, fontSize: 14,
    backgroundColor: colors.bg1, textAlignVertical: 'top',
  },
  resultHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.md,
  },
  doneBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.success, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  doneBadgeText: { fontFamily: font.bold, fontSize: 11, color: '#fff' },
  secTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  themeName: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right' },
  swatches: { flexDirection: 'row', gap: 8, marginTop: 12 },
  swatch: { width: 42, height: 42, borderRadius: 11 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  sectionDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textMid, textAlign: 'right', marginTop: 3, lineHeight: 18 },
  budgetRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: spacing.lg, marginTop: spacing.md,
    backgroundColor: '#fff', borderRadius: radii.md,
    padding: spacing.md, borderWidth: 1, borderColor: colors.glassBorder,
  },
  budgetIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center' },
  budgetTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  budgetDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textMid, textAlign: 'right', marginTop: 2 },
  budgetSave: { fontFamily: font.bold, fontSize: 18, color: colors.success },
  programRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  programBorder: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
  programEvent: { fontFamily: font.medium, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  timePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.pinkSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  timeText: { fontFamily: font.bold, fontSize: 11.5, color: colors.brand },
});
