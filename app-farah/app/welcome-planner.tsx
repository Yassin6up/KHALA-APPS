import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, PlaneTakeoff, Sparkles, MapPin, Coffee, Camera } from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, radii, spacing } from '../src/theme';

export default function WelcomePlanner() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  function generate() {
    if (!prompt.trim()) return;
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
        <Image source={{ uri: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&q=80' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.8)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.heroNav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <View style={[styles.heroIcon, { backgroundColor: '#10B981' }]}>
            <PlaneTakeoff size={19} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>مخطط استقبال المسافرين</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <GlassCard style={styles.formCard}>
          <Text style={styles.label}>من هم القادمون؟</Text>
          <TextInput 
            style={styles.input} 
            placeholder="مثال: استقبال أهلي بعد عودتهم من الحج، في صالة المطار..." 
            placeholderTextColor={colors.textLo} 
            value={prompt} 
            onChangeText={setPrompt} 
            multiline
            textAlign="right" 
          />
          <PrimaryButton 
            label={generating ? 'جاري التخطيط...' : 'تخطيط الاستقبال'} 
            onPress={generate} 
            loading={generating} 
            icon={!generating ? <Sparkles size={18} color="#fff" /> : undefined}
          />
        </GlassCard>

        {done && (
          <View style={styles.resultContainer}>
            <Text style={styles.secTitle}>خطة الاستقبال المقترحة</Text>
            
            <GlassCard style={styles.planCard}>
              <View style={styles.planRow}>
                <View style={styles.planIcon}><MapPin size={18} color="#10B981" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>الموقع والاستقبال</Text>
                  <Text style={styles.planDesc}>التجمع في صالة الوصول مع باقات ورد وتوزيعات بسيطة تحمل عبارة "حج مبرور وسعي مشكور".</Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.planCard}>
              <View style={styles.planRow}>
                <View style={styles.planIcon}><Coffee size={18} color="#10B981" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>الضيافة المنزلية</Text>
                  <Text style={styles.planDesc}>تجهيز بوفيه عشاء خفيف في المنزل يتضمن القهوة العربية، التمر، وحلويات ترحيبية خاصة.</Text>
                </View>
              </View>
            </GlassCard>

            <GlassCard style={styles.planCard}>
              <View style={styles.planRow}>
                <View style={styles.planIcon}><Camera size={18} color="#10B981" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>التوثيق</Text>
                  <Text style={styles.planDesc}>تخصيص زاوية صغيرة للتصوير مع خلفية جاهزة لتوثيق لحظة العودة.</Text>
                </View>
              </View>
            </GlassCard>
            
            <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.md }}>
               <PrimaryButton label="حفظ الخطة ومشاركتها" variant="gold" onPress={() => {}} />
            </View>
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
  formCard: { marginHorizontal: spacing.lg, gap: 12 },
  label: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 12, padding: 14, color: colors.textHi, fontFamily: font.regular, fontSize: 14, backgroundColor: colors.bg1, textAlign: 'right', minHeight: 100, textAlignVertical: 'top' },
  resultContainer: { marginTop: spacing.xl, gap: 10 },
  secTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi, textAlign: 'right', paddingHorizontal: spacing.lg, marginBottom: 6 },
  planCard: { marginHorizontal: spacing.lg, padding: spacing.md },
  planRow: { flexDirection: 'row', gap: 12 },
  planIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center' },
  planTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  planDesc: { fontFamily: font.regular, fontSize: 13, color: colors.textMid, textAlign: 'right', marginTop: 4, lineHeight: 20 },
});
