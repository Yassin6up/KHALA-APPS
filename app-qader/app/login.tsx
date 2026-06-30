import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

WebBrowser.maybeCompleteAuthSession();

const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const AND_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const PLACEHOLDER = 'NOT_CONFIGURED';

type Stage = 'login' | 'email-only';

export default function Login() {
  const [stage, setStage] = useState<Stage>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: WEB_ID || PLACEHOLDER,
    iosClientId: IOS_ID || WEB_ID || PLACEHOLDER,
    androidClientId: AND_ID || WEB_ID || PLACEHOLDER,
    scopes: ['profile', 'email', 'openid'],
  });

  useEffect(() => {
    if (!googleResponse) return;
    if (googleResponse.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) {
        handleSocialLogin('google', idToken);
      } else {
        setGoogleLoading(false);
        Alert.alert('خطأ', 'لم يُستلم رمز Google. تحقق من إعداد Client IDs.');
      }
    } else if (googleResponse.type === 'error') {
      setGoogleLoading(false);
      Alert.alert('خطأ', googleResponse.error?.message ?? 'تعذّر تسجيل الدخول بـ Google');
    } else {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  async function handleLogin() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      Alert.alert('خطأ', 'أدخل البريد الإلكتروني وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: { email: trimmedEmail, password },
          auth: false,
        },
      );
      await authStore.setTokens(res.accessToken, res.refreshToken);
      router.replace('/assessment');
    } catch (e: unknown) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  function goSetup() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('خطأ', 'أدخل عنوان بريد إلكتروني صحيح');
      return;
    }
    router.push({ pathname: '/setup-account', params: { email: trimmedEmail } });
  }

  async function handleSocialLogin(provider: 'google' | 'apple', idToken: string, fullName?: string) {
    setGoogleLoading(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string }>(
        '/auth/social',
        { method: 'POST', body: { provider, idToken, fullName }, auth: false },
      );
      await authStore.setTokens(res.accessToken, res.refreshToken);
      router.replace('/assessment');
    } catch (e: unknown) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'تعذّر تسجيل الدخول');
      setGoogleLoading(false);
    }
  }

  function startGoogle() {
    if (!WEB_ID) {
      Alert.alert(
        'إعداد مطلوب',
        'أضف EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID إلى .env\nأنشئه من: console.cloud.google.com/apis/credentials',
      );
      return;
    }
    setGoogleLoading(true);
    googlePrompt();
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
            {/* Brand */}
            <View style={styles.hero}>
              <LinearGradient
                colors={['#2EC5B6', '#6C8BFF']}
                style={styles.logoRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoChar}>ق</Text>
              </LinearGradient>
              <Text style={[type.display, styles.center]}>قادر</Text>
              <Text style={[type.body, styles.center, { color: colors.textLo, marginTop: -8 }]}>
                {stage === 'login'
                  ? 'سجّل الدخول أو أنشئ حساباً'
                  : `أدخل بريدك لإنشاء حساب جديد`}
              </Text>
            </View>

            {/* Form card */}
            <GlassCard>
              {stage === 'login' ? (
                <>
                  <Text style={styles.label}>البريد الإلكتروني</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.textLo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    textAlign="right"
                  />
                  <Text style={styles.label}>كلمة المرور</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textLo}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    textAlign="right"
                    onSubmitEditing={handleLogin}
                  />
                  <PrimaryButton
                    label={loading ? '' : 'تسجيل الدخول'}
                    onPress={handleLogin}
                    loading={loading}
                  />
                  <Pressable onPress={() => { setStage('email-only'); setPassword(''); }} style={styles.backRow}>
                    <Text style={styles.backText}>لا تملك حساباً؟ سجل الآن</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.label}>البريد الإلكتروني</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="example@email.com"
                    placeholderTextColor={colors.textLo}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    textAlign="right"
                    onSubmitEditing={goSetup}
                  />
                  <PrimaryButton
                    label="التالي"
                    onPress={goSetup}
                  />
                  <Pressable onPress={() => { setStage('login'); }} style={styles.backRow}>
                    <Text style={styles.backText}>لديك حساب؟ سجل الدخول</Text>
                  </Pressable>
                </>
              )}
            </GlassCard>

            {/* Divider */}
            <View style={styles.divRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>أو</Text>
              <View style={styles.divLine} />
            </View>

            {/* Google */}
            <Pressable onPress={startGoogle} style={styles.socialBtn} disabled={googleLoading}>
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" />
              ) : (
                <>
                  <Text style={styles.googleG}>G</Text>
                  <Text style={styles.socialLabel}>المتابعة بـ Google</Text>
                </>
              )}
            </Pressable>

            {/* Apple (iOS only) */}
            {Platform.OS === 'ios' && (
              <Pressable style={[styles.socialBtn, styles.appleBtn]}>
                <Text style={styles.appleLogo}></Text>
                <Text style={[styles.socialLabel, { color: '#fff' }]}>المتابعة بـ Apple</Text>
              </Pressable>
            )}

            <Pressable onPress={() => router.replace('/(tabs)')} style={styles.skip}>
              <Text style={styles.skipText}>تخطّي ← استعراض بدون حساب</Text>
            </Pressable>
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
  hero: { alignItems: 'center', gap: spacing.sm },
  center: { textAlign: 'center' },
  logoRing: {
    width: 84, height: 84, borderRadius: 84,
    alignItems: 'center', justifyContent: 'center',
  },
  logoChar: { fontFamily: font.bold, fontSize: 42, color: '#fff' },
  label: {
    fontFamily: font.medium, color: colors.textMid,
    textAlign: 'right', marginBottom: 10, fontSize: 14,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textHi, fontFamily: font.regular, fontSize: 16,
    backgroundColor: colors.bg2, marginBottom: spacing.md,
  },
  otpInput: {
    textAlign: 'center', letterSpacing: 12,
    fontSize: 28, fontFamily: font.bold,
  },
  hint: {
    fontFamily: font.regular, color: colors.textLo,
    fontSize: 12, textAlign: 'center', marginTop: spacing.sm, lineHeight: 18,
  },
  backRow: { alignItems: 'center', marginTop: spacing.md },
  backText: { fontFamily: font.regular, color: colors.textLo, fontSize: 14 },
  divRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  divText: { fontFamily: font.regular, color: colors.textLo, fontSize: 13 },
  socialBtn: {
    height: 54, borderRadius: radii.pill,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: colors.glassBorder,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  appleBtn: { backgroundColor: '#000', borderColor: '#000' },
  googleG: { fontFamily: font.bold, fontSize: 20, color: '#4285F4' },
  socialLabel: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  appleLogo: { fontSize: 20, color: '#fff' },
  skip: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { fontFamily: font.regular, color: colors.textLo, fontSize: 13 },
});
