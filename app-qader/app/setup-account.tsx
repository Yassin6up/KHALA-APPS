import { router, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing, type } from '../src/theme';
import { ChevronRight } from 'lucide-react-native';

export default function SetupAccount() {
  const params = useLocalSearchParams();
  const initialEmail = Array.isArray(params.email) ? params.email[0] : params.email || '';

  const [step, setStep] = useState(1); // 1: Password, 2: Phone, 3: Profile
  const [loading, setLoading] = useState(false);

  // Form state
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(''); // Will leave empty for now, maybe pick image later

  async function handleNext() {
    if (step === 1) {
      if (password.length < 6) {
        Alert.alert('كلمة المرور قصيرة', 'يجب أن تكون كلمة المرور 6 أحرف على الأقل');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!phone || phone.length < 8) {
        Alert.alert('رقم هاتف غير صالح', 'أدخل رقم هاتف صحيح');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!fullName) {
        Alert.alert('الاسم مطلوب', 'الرجاء إدخال اسمك الكامل');
        return;
      }
      await submitRegistration();
    }
  }

  async function submitRegistration() {
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string }>('/auth/register', {
        method: 'POST',
        body: {
          email: initialEmail,
          password,
          phone,
          fullName,
          avatarUrl: avatarUrl || undefined,
        },
        auth: false,
      });
      await authStore.setTokens(res.accessToken, res.refreshToken);
      router.replace('/assessment');
    } catch (e: unknown) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'تعذّر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <GradientBackground>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header & Step Indicator */}
            <View style={styles.header}>
              <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ChevronRight size={24} color={colors.textLo} />
                <Text style={styles.backBtn}>عودة</Text>
              </Pressable>
              <View style={styles.dotsRow}>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.dot, step >= i && styles.dotActive]} />
                ))}
              </View>
              <View style={{ width: 50 }} /> {/* Spacer */}
            </View>

            {/* Illustration */}
            <View style={styles.imageContainer}>
              <View style={styles.imageBox}>
                {step === 1 && <Image source={require('../assets/images/setup_password.png')} style={styles.image} />}
                {step === 2 && <Image source={require('../assets/images/setup_phone.png')} style={styles.image} />}
                {step === 3 && <Image source={require('../assets/images/setup_profile.png')} style={styles.image} />}
              </View>
            </View>

            {/* Text Context */}
            <View style={styles.hero}>
              <Text style={[type.h1, styles.center]}>
                {step === 1 ? 'أمان حسابك' : step === 2 ? 'تأكيد التواصل' : 'من أنت؟'}
              </Text>
              <Text style={[type.body, styles.center, { color: colors.textLo }]}>
                {step === 1
                  ? 'أنشئ كلمة مرور قوية لحماية بياناتك.'
                  : step === 2
                  ? 'أضف رقم هاتفك لتسهيل الوصول لحسابك.'
                  : 'أخبرنا باسمك لنجعل تجربتك أكثر شخصية.'}
              </Text>
            </View>

            {/* Form card */}
            <GlassCard>
              {step === 1 && (
                <>
                  <Text style={styles.label}>كلمة المرور</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textLo}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    textAlign="right"
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </>
              )}

              {step === 2 && (
                <>
                  <Text style={styles.label}>رقم الهاتف</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="968xxxxxxx"
                    placeholderTextColor={colors.textLo}
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    textAlign="right"
                    returnKeyType="next"
                    onSubmitEditing={handleNext}
                  />
                </>
              )}

              {step === 3 && (
                <>
                  <Text style={styles.label}>الاسم الكامل</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="محمد عبدالله"
                    placeholderTextColor={colors.textLo}
                    value={fullName}
                    onChangeText={setFullName}
                    textAlign="right"
                    returnKeyType="done"
                    onSubmitEditing={handleNext}
                  />
                </>
              )}

              <PrimaryButton
                label={loading ? '' : step === 3 ? 'إكمال التسجيل' : 'التالي'}
                onPress={handleNext}
                loading={loading}
              />
            </GlassCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  kav: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: 60,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    fontFamily: font.medium,
    color: colors.textLo,
    fontSize: 16,
    paddingVertical: 10,
    paddingRight: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: colors.brand,
    width: 24,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  imageBox: {
    width: 220,
    height: 220,
    borderRadius: 10,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  hero: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  center: { textAlign: 'center' },
  label: {
    fontFamily: font.medium, color: colors.textMid,
    textAlign: 'right', marginBottom: 10, fontSize: 14,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textHi, fontFamily: font.regular, fontSize: 16,
    backgroundColor: colors.bg2, marginBottom: spacing.lg,
  },
});
