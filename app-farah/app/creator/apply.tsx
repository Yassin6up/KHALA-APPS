import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { Header } from '../../src/components/Header';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../src/theme';
import { Camera, CheckCircle } from 'lucide-react-native';

export default function ApplyCreator() {
  const [fullName, setFullName] = useState('');
  const [bioAr, setBioAr] = useState('');
  const [priceMinor, setPriceMinor] = useState('');
  const [availableDatesJson, setAvailableDatesJson] = useState('كل أيام الأسبوع');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Example placeholder logic for the image. Normally, you'd use expo-image-picker here.
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);

  async function submit() {
    if (!fullName || !bioAr) return;
    setLoading(true);
    try {
      await api('/creators/apply', {
        method: 'POST',
        body: {
          fullName,
          bioAr,
          priceMinor: parseInt(priceMinor, 10) * 1000 || 0, // Convert OMR to Minor
          availableDatesJson: { text: availableDatesJson },
          faceImageUrl: faceImageUrl || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
        },
      });
      setSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <GradientBackground>
        <Header title="حساب صانع محتوى" />
        <View style={styles.successContainer}>
          <CheckCircle size={80} color={colors.success} />
          <Text style={[type.h2, { marginTop: spacing.md, textAlign: 'center' }]}>
            تم تقديم طلبك بنجاح!
          </Text>
          <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>
            أنت الآن صانع محتوى. يمكنك البدء بإضافة خدماتك ومنتجاتك في سوق المبدعين.
          </Text>
          <Pressable
            style={[styles.btn, { marginTop: spacing.xl }]}
            onPress={() => router.replace('/bazar')}
          >
            <Text style={styles.btnText}>الذهاب إلى السوق</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header title="انضم كصانع محتوى" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.root}>
          <Text style={type.h2}>أكمل بياناتك الشخصية</Text>
          <Text style={[type.body, { color: colors.textLo, marginBottom: spacing.md }]}>
            ليتمكن العملاء من معرفتك والوثوق بك، نرجو توفير صورة واضحة لوجهك ومعلومات دقيقة.
          </Text>

          <GlassCard style={styles.imageSection}>
            <Text style={styles.label}>صورة الوجه (مثال توضيحي)</Text>
            <View style={styles.imagesRow}>
              <View style={styles.exampleWrapper}>
                <Image
                  source={require('../../assets/images/creator_example_face.jpg')}
                  style={styles.exampleImage}
                />
                <Text style={styles.exampleText}>مثال</Text>
              </View>
              <Pressable
                style={styles.uploadBox}
                onPress={() => setFaceImageUrl('uploaded_image_url')}
              >
                <Camera size={32} color={colors.brand} />
                <Text style={styles.uploadText}>
                  {faceImageUrl ? 'تم الرفع' : 'التقط صورتك'}
                </Text>
              </Pressable>
            </View>
          </GlassCard>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>الاسم الكامل</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: أحمد عبد الله"
              placeholderTextColor={colors.textLo}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>نبذة عنك (Bio)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="تحدث عن مهاراتك وما تقدمه..."
              placeholderTextColor={colors.textLo}
              multiline
              numberOfLines={4}
              value={bioAr}
              onChangeText={setBioAr}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>سعرك المبدئي للعمل (OMR)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 50"
              placeholderTextColor={colors.textLo}
              keyboardType="numeric"
              value={priceMinor}
              onChangeText={setPriceMinor}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>أيام التوفر للعمل</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: كل أيام الأسبوع عدا الجمعة"
              placeholderTextColor={colors.textLo}
              value={availableDatesJson}
              onChangeText={setAvailableDatesJson}
            />
          </View>

          <Pressable style={styles.btn} onPress={submit} disabled={loading || !fullName || !bioAr}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>تسجيل كصانع محتوى</Text>}
          </Pressable>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  imageSection: { gap: spacing.sm },
  imagesRow: { flexDirection: 'row', gap: spacing.md },
  exampleWrapper: { alignItems: 'center', gap: 4 },
  exampleImage: { width: 80, height: 80, borderRadius: 16, resizeMode: 'cover' },
  exampleText: { fontFamily: font.medium, fontSize: 12, color: colors.textLo },
  uploadBox: { flex: 1, height: 80, borderRadius: 16, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.brand, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadText: { fontFamily: font.medium, fontSize: 12, color: colors.brand },
  inputGroup: { gap: 8 },
  label: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  input: { backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.md, padding: spacing.md, color: colors.textHi, fontFamily: font.regular, textAlign: 'right' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  btn: { backgroundColor: colors.brand, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.lg },
  btnText: { fontFamily: font.bold, color: '#fff', fontSize: 16 },
});
