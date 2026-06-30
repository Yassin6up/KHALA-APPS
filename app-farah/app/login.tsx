import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput,
  TouchableWithoutFeedback, View,
} from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing } from '../src/theme';

WebBrowser.maybeCompleteAuthSession();

const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '';
const AND_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const PLACEHOLDER = 'NOT_CONFIGURED';

type Stage = 'login' | 'register';

export default function Login() {
  const [stage, setStage] = useState<Stage>('login');
  const [fullName, setFullName] = useState('');
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

  async function handleSubmit() {
    const mail = email.trim().toLowerCase();
    if (!mail || !password) { Alert.alert('تنبيه', 'أدخل البريد وكلمة المرور'); return; }
    if (stage === 'register' && !fullName.trim()) { Alert.alert('تنبيه', 'أدخل اسمك'); return; }
    setLoading(true);
    try {
      const path = stage === 'login' ? '/auth/login' : '/auth/register';
      const body = stage === 'login'
        ? { email: mail, password }
        : { email: mail, password, fullName: fullName.trim() };
      const res = await api<{ accessToken: string; refreshToken: string }>(
        path, { method: 'POST', body, auth: false },
      );
      await authStore.setTokens(res.accessToken, res.refreshToken);
      await api('/me/join', { method: 'POST' }).catch(() => null);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  async function handleSocialLogin(provider: 'google' | 'apple', idToken: string, fullName?: string) {
    setGoogleLoading(true);
    try {
      const res = await api<{ accessToken: string; refreshToken: string }>(
        '/auth/social',
        { method: 'POST', body: { provider, idToken, fullName }, auth: false },
      );
      await authStore.setTokens(res.accessToken, res.refreshToken);
      await api('/me/join', { method: 'POST' }).catch(() => null);
      router.replace('/(tabs)');
    } catch (e) {
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
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
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
                colors={[colors.brand, colors.brand2]}
                style={styles.logoRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.logoChar}>ف</Text>
              </LinearGradient>
              <Text style={styles.brandTitle}>فرح <Text style={{ color: colors.brand }}>AI</Text></Text>
              <Text style={styles.brandSub}>
                {stage === 'login' ? 'سجّل الدخول لمواصلة الاحتفال' : 'أنشئ حسابك وابدأ رحلتك'}
              </Text>
            </View>

            {/* Tab toggle */}
            <View style={styles.toggle}>
              <Pressable
                onPress={() => setStage('login')}
                style={[styles.toggleTab, stage === 'login' && styles.toggleTabActive]}
              >
                <Text style={[styles.toggleText, stage === 'login' && styles.toggleTextActive]}>
                  تسجيل الدخول
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setStage('register')}
                style={[styles.toggleTab, stage === 'register' && styles.toggleTabActive]}
              >
                <Text style={[styles.toggleText, stage === 'register' && styles.toggleTextActive]}>
                  حساب جديد
                </Text>
              </Pressable>
            </View>

            {/* Form */}
            <GlassCard>
              {stage === 'register' && (
                <>
                  <Text style={styles.label}>الاسم الكامل</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="اسمك الكامل"
                    placeholderTextColor={colors.textLo}
                    value={fullName}
                    onChangeText={setFullName}
                    textAlign="right"
                  />
                </>
              )}
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
                onSubmitEditing={handleSubmit}
              />
              <PrimaryButton
                label={stage === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                onPress={handleSubmit}
                loading={loading}
              />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: {
    flexGrow: 1, padding: spacing.lg,
    paddingTop: 64, gap: spacing.lg, paddingBottom: spacing.xxl,
  },
  hero: { alignItems: 'center', gap: spacing.sm },
  logoRing: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  logoChar: { fontFamily: font.bold, fontSize: 40, color: '#fff' },
  brandTitle: { fontFamily: font.bold, fontSize: 28, color: colors.textHi, marginTop: 4 },
  brandSub: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'center' },
  toggle: {
    flexDirection: 'row', backgroundColor: colors.bg1,
    borderRadius: radii.pill, padding: 4, borderWidth: 1, borderColor: colors.glassBorder,
  },
  toggleTab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: radii.pill },
  toggleTabActive: { backgroundColor: colors.brand },
  toggleText: { fontFamily: font.medium, fontSize: 14.5, color: colors.textMid },
  toggleTextActive: { color: '#fff', fontFamily: font.bold },
  label: {
    fontFamily: font.medium, color: colors.textMid,
    textAlign: 'right', marginBottom: 8, fontSize: 13.5,
  },
  input: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textHi, fontFamily: font.regular, fontSize: 15.5,
    backgroundColor: colors.bg1, marginBottom: spacing.md,
  },
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
  socialLabel: { fontFamily: font.bold, fontSize: 15.5, color: colors.textHi },
  appleLogo: { fontSize: 19, color: '#fff' },
  skip: { alignItems: 'center', paddingVertical: spacing.sm },
  skipText: { fontFamily: font.regular, color: colors.textLo, fontSize: 13 },
});
