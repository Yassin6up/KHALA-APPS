import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import { Camera } from 'lucide-react-native';

export default function CreateBazarPost() {
  const [titleAr, setTitleAr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [priceMinor, setPriceMinor] = useState('');
  const [typeVal, setTypeVal] = useState('product'); // product | service | rent
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!titleAr || !descAr) return;
    setLoading(true);
    try {
      await api('/bazar', {
        method: 'POST',
        body: {
          titleAr,
          descAr,
          type: typeVal,
          priceMinor: parseInt(priceMinor, 10) * 1000 || 0,
          coverUrl: 'https://images.unsplash.com/photo-1555617112-92fc9e36511a?w=400&q=80',
          imagesJson: [],
        },
      });
      router.back();
    } catch (e) {
      console.error(e);
      // Might not be an approved creator yet
      alert('حدث خطأ. يرجى التأكد من أنك صانع محتوى معتمد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <Header title="إضافة عرض جديد" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.root}>
          
          <Pressable style={styles.uploadBox}>
            <Camera size={32} color={colors.brand} />
            <Text style={styles.uploadText}>إضافة صور العرض</Text>
          </Pressable>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>النوع</Text>
            <View style={styles.row}>
              {['product', 'service', 'rent'].map((t) => (
                <Pressable
                  key={t}
                  style={[styles.typeBtn, typeVal === t && styles.typeBtnActive]}
                  onPress={() => setTypeVal(t)}
                >
                  <Text style={[styles.typeBtnText, typeVal === t && styles.typeBtnTextActive]}>
                    {t === 'product' ? 'منتج' : t === 'service' ? 'خدمة' : 'إيجار'}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>عنوان العرض</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: تصميم شعار احترافي"
              placeholderTextColor={colors.textLo}
              value={titleAr}
              onChangeText={setTitleAr}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>الوصف والتفاصيل</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="اكتب تفاصيل ما تقدمه للعميل..."
              placeholderTextColor={colors.textLo}
              multiline
              numberOfLines={4}
              value={descAr}
              onChangeText={setDescAr}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>السعر (OMR)</Text>
            <TextInput
              style={styles.input}
              placeholder="مثال: 15"
              placeholderTextColor={colors.textLo}
              keyboardType="numeric"
              value={priceMinor}
              onChangeText={setPriceMinor}
            />
          </View>

          <Pressable style={styles.btn} onPress={submit} disabled={loading || !titleAr || !descAr}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>نشر في السوق</Text>}
          </Pressable>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md },
  uploadBox: { height: 120, borderRadius: 16, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.brand, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8 },
  uploadText: { fontFamily: font.medium, fontSize: 14, color: colors.brand },
  inputGroup: { gap: 8 },
  label: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  input: { backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.md, padding: spacing.md, color: colors.textHi, fontFamily: font.regular, textAlign: 'right' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm },
  typeBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: radii.sm, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill },
  typeBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  typeBtnText: { fontFamily: font.medium, color: colors.textHi },
  typeBtnTextActive: { color: '#fff' },
  btn: { backgroundColor: colors.brand, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.lg },
  btnText: { fontFamily: font.bold, color: '#fff', fontSize: 16 },
});
