import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, TrendingDown, Wand2, DollarSign, Users, Sparkles } from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, radii, spacing } from '../src/theme';

export default function Budget() {
  const [budget, setBudget] = useState('');
  const [guests, setGuests] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  function optimize() {
    if (!budget || !guests) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setDone(true);
    }, 1500);
  }

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.heroNav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <View style={[styles.heroIcon, { backgroundColor: '#F5B301' }]}>
            <TrendingDown size={19} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>محسّن الميزانية الذكي</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <GlassCard style={styles.formCard}>
          <Text style={styles.formTitle}>الميزانية الإجمالية وعدد الضيوف</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>الميزانية المقترحة (ريال)</Text>
            <View style={styles.inputWrapper}>
              <DollarSign size={20} color={colors.textMid} />
              <TextInput style={styles.inputFlex} placeholder="مثال: 50,000" keyboardType="numeric" placeholderTextColor={colors.textLo} value={budget} onChangeText={setBudget} textAlign="right" />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>عدد الضيوف المتوقع</Text>
            <View style={styles.inputWrapper}>
              <Users size={20} color={colors.textMid} />
              <TextInput style={styles.inputFlex} placeholder="مثال: 200" keyboardType="numeric" placeholderTextColor={colors.textLo} value={guests} onChangeText={setGuests} textAlign="right" />
            </View>
          </View>

          <PrimaryButton 
            label={generating ? 'جاري التحليل...' : 'تحسين الميزانية'} 
            onPress={optimize} 
            loading={generating} 
            icon={!generating ? <Wand2 size={18} color="#fff" /> : undefined}
          />
        </GlassCard>

        {done && (
          <View style={styles.resultContainer}>
            <Text style={styles.secTitle}>النتيجة والبدائل الذكية</Text>
            
            <View style={styles.savingsBox}>
              <Text style={styles.savingsTitle}>المبلغ الذي يمكنك توفيره</Text>
              <Text style={styles.savingsValue}>١٢,٥٠٠ ريال</Text>
              <Text style={styles.savingsDesc}>توفير بنسبة ٢٥٪ مع الحفاظ على الفخامة والجودة العالية.</Text>
            </View>
            
            <GlassCard style={styles.alternativeCard}>
              <View style={styles.altIcon}><Sparkles size={16} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.altTitle}>بديل الديكور والورد</Text>
                <Text style={styles.altDesc}>استخدام ورد صناعي عالي الجودة للأسقف والخلفيات، وورد طبيعي للطاولات فقط، يوفر ٤,٠٠٠ ريال.</Text>
              </View>
            </GlassCard>
            
            <GlassCard style={styles.alternativeCard}>
              <View style={styles.altIcon}><Sparkles size={16} color={colors.brand} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.altTitle}>بديل التصوير</Text>
                <Text style={styles.altDesc}>حجز باقة التغطية الشاملة بدلاً من حجز مصورات مستقلات، يوفر ٢,٥٠٠ ريال.</Text>
              </View>
            </GlassCard>
          </View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 180, justifyContent: 'flex-end' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, padding: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: font.bold, fontSize: 22, color: '#fff' },
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.lg },
  formCard: { marginHorizontal: spacing.lg, gap: 16 },
  formTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right', marginBottom: 4 },
  inputGroup: { gap: 8 },
  label: { fontFamily: font.medium, fontSize: 13, color: colors.textMid, textAlign: 'right' },
  inputWrapper: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 10, paddingHorizontal: 12, backgroundColor: colors.bg1 },
  inputFlex: { flex: 1, paddingVertical: 12, color: colors.textHi, fontFamily: font.bold, fontSize: 16, textAlign: 'right' },
  resultContainer: { marginTop: spacing.xl },
  secTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi, textAlign: 'right', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  savingsBox: { marginHorizontal: spacing.lg, backgroundColor: '#ECFDF5', padding: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: '#A7F3D0', alignItems: 'center', marginBottom: spacing.md },
  savingsTitle: { fontFamily: font.medium, fontSize: 14, color: '#047857' },
  savingsValue: { fontFamily: font.bold, fontSize: 32, color: '#059669', marginVertical: 4 },
  savingsDesc: { fontFamily: font.regular, fontSize: 12, color: '#065F46', textAlign: 'center' },
  alternativeCard: { marginHorizontal: spacing.lg, marginBottom: 10, flexDirection: 'row', gap: 12, padding: spacing.md },
  altIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  altTitle: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  altDesc: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMid, textAlign: 'right', marginTop: 4, lineHeight: 20 },
});
