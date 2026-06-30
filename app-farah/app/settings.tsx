import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Camera, User, Lock, Trash2, ChevronLeft } from 'lucide-react-native';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing } from '../src/theme';

type Me = { user: { id: string; fullName?: string; email?: string; avatarUrl?: string } };

type Sheet = 'name' | 'password' | 'avatar' | null;

export default function Settings() {
  const [me, setMe] = useState<Me | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [loading, setLoading] = useState(false);

  // name form
  const [fullName, setFullName] = useState('');
  // password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  // avatar form
  const [avatarUrl, setAvatarUrl] = useState('');

  useEffect(() => {
    api<Me>('/me').then((m) => { setMe(m); setFullName(m.user.fullName ?? ''); setAvatarUrl(m.user.avatarUrl ?? ''); }).catch(() => null);
  }, []);

  function openSheet(s: Sheet) { setSheet(s); Keyboard.dismiss(); }
  function closeSheet() { setSheet(null); setCurrentPw(''); setNewPw(''); }

  async function saveName() {
    if (!fullName.trim()) return;
    setLoading(true);
    try {
      await api('/me', { method: 'PATCH', body: { fullName: fullName.trim() } });
      setMe((m) => m ? { ...m, user: { ...m.user, fullName: fullName.trim() } } : m);
      closeSheet();
      Alert.alert('', 'تم تحديث الاسم بنجاح');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally { setLoading(false); }
  }

  async function savePassword() {
    if (!currentPw || !newPw || newPw.length < 6) {
      Alert.alert('تنبيه', 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      await api('/me/password', { method: 'PATCH', body: { currentPassword: currentPw, newPassword: newPw } });
      closeSheet();
      Alert.alert('', 'تم تغيير كلمة المرور بنجاح');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally { setLoading(false); }
  }

  async function saveAvatar() {
    if (!avatarUrl.trim()) return;
    setLoading(true);
    try {
      await api('/me', { method: 'PATCH', body: { avatarUrl: avatarUrl.trim() } });
      setMe((m) => m ? { ...m, user: { ...m.user, avatarUrl: avatarUrl.trim() } } : m);
      closeSheet();
      Alert.alert('', 'تم تحديث صورة الملف الشخصي');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally { setLoading(false); }
  }

  function deleteAccount() {
    Alert.alert(
      'حذف الحساب',
      'هل أنت متأكد؟ سيتم حذف جميع بياناتك نهائياً ولا يمكن التراجع.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف نهائياً', style: 'destructive',
          onPress: async () => {
            try {
              await api('/me', { method: 'DELETE' });
              await authStore.clear();
              router.replace('/onboarding');
            } catch (e) {
              Alert.alert('خطأ', 'تعذّر حذف الحساب');
            }
          },
        },
      ],
    );
  }

  const name = me?.user?.fullName ?? '';
  const avatar = me?.user?.avatarUrl;

  const MENU = [
    { key: 'name', label: 'تغيير الاسم', sub: name, icon: User, onPress: () => openSheet('name') },
    { key: 'avatar', label: 'تغيير صورة الملف الشخصي', sub: 'رابط الصورة', icon: Camera, onPress: () => openSheet('avatar') },
    { key: 'password', label: 'تغيير كلمة المرور', sub: '••••••••', icon: Lock, onPress: () => openSheet('password') },
  ];

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>الإعدادات</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <Pressable onPress={() => openSheet('avatar')} style={styles.avatarBlock}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{name.charAt(0) || 'ف'}</Text>
            </View>
          )}
          <View style={styles.cameraOverlay}><Camera size={16} color="#fff" /></View>
          <Text style={styles.avatarLabel}>تغيير الصورة</Text>
        </Pressable>

        {/* Settings menu */}
        <View style={styles.menuCard}>
          {MENU.map((m, i) => (
            <Pressable key={m.key} onPress={m.onPress}
              style={[styles.menuRow, i < MENU.length - 1 && styles.menuBorder]}>
              <ChevronLeft size={17} color={colors.textLo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.menuLabel}>{m.label}</Text>
                {m.sub && <Text style={styles.menuSub} numberOfLines={1}>{m.sub}</Text>}
              </View>
              <View style={styles.menuIcon}><m.icon size={17} color={colors.brand} /></View>
            </Pressable>
          ))}
        </View>

        {/* Danger zone */}
        <View style={styles.dangerCard}>
          <Text style={styles.dangerTitle}>منطقة الخطر</Text>
          <Pressable onPress={deleteAccount} style={styles.deleteBtn}>
            <Trash2 size={17} color={colors.danger} />
            <Text style={styles.deleteBtnText}>حذف الحساب نهائياً</Text>
          </Pressable>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Bottom sheets */}
      {sheet && (
        <TouchableWithoutFeedback onPress={closeSheet}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
      )}

      {sheet === 'name' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>تغيير الاسم</Text>
            <TextInput
              style={styles.sheetInput}
              value={fullName}
              onChangeText={setFullName}
              placeholder="الاسم الكامل"
              placeholderTextColor={colors.textLo}
              textAlign="right"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={closeSheet} style={styles.cancelBtn}><Text style={styles.cancelText}>إلغاء</Text></Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="حفظ" onPress={saveName} loading={loading} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {sheet === 'avatar' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>تغيير الصورة</Text>
            <Text style={styles.sheetSub}>أدخل رابط URL صورتك الشخصية</Text>
            <TextInput
              style={styles.sheetInput}
              value={avatarUrl}
              onChangeText={setAvatarUrl}
              placeholder="https://example.com/photo.jpg"
              placeholderTextColor={colors.textLo}
              keyboardType="url"
              autoCapitalize="none"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={closeSheet} style={styles.cancelBtn}><Text style={styles.cancelText}>إلغاء</Text></Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="حفظ" onPress={saveAvatar} loading={loading} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}

      {sheet === 'password' && (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>تغيير كلمة المرور</Text>
            <TextInput
              style={[styles.sheetInput, { marginBottom: 10 }]}
              value={currentPw}
              onChangeText={setCurrentPw}
              placeholder="كلمة المرور الحالية"
              placeholderTextColor={colors.textLo}
              secureTextEntry
              textAlign="right"
              autoFocus
            />
            <TextInput
              style={styles.sheetInput}
              value={newPw}
              onChangeText={setNewPw}
              placeholder="كلمة المرور الجديدة (6 أحرف على الأقل)"
              placeholderTextColor={colors.textLo}
              secureTextEntry
              textAlign="right"
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={closeSheet} style={styles.cancelBtn}><Text style={styles.cancelText}>إلغاء</Text></Pressable>
              <View style={{ flex: 1 }}>
                <PrimaryButton label="تغيير" onPress={savePassword} loading={loading} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.glassBorder,
  },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  navTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  scroll: { padding: spacing.lg },
  avatarBlock: { alignItems: 'center', gap: 8, marginBottom: spacing.xl },
  avatarImg: { width: 90, height: 90, borderRadius: 90 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 90, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: font.bold, fontSize: 36, color: '#fff' },
  cameraOverlay: { position: 'absolute', top: 62, right: '37%', width: 28, height: 28, borderRadius: 28, backgroundColor: colors.brand2, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarLabel: { fontFamily: font.medium, fontSize: 13, color: colors.brand },
  menuCard: {
    backgroundColor: '#fff', borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.glassBorder, marginBottom: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, height: 60 },
  menuBorder: { borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  menuLabel: { fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  menuSub: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right', marginTop: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' },
  dangerCard: {
    backgroundColor: '#fff', borderRadius: radii.md,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', padding: spacing.md,
  },
  dangerTitle: { fontFamily: font.bold, fontSize: 13, color: colors.danger, textAlign: 'right', marginBottom: spacing.sm },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, paddingVertical: 8 },
  deleteBtnText: { fontFamily: font.bold, fontSize: 15, color: colors.danger },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10 },
  sheetWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 20 },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: spacing.lg, gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, backgroundColor: colors.glassBorder, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi, textAlign: 'right' },
  sheetSub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', marginTop: -8 },
  sheetInput: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 13,
    color: colors.textHi, fontFamily: font.regular, fontSize: 15,
    backgroundColor: colors.bg1,
  },
  cancelBtn: { height: 52, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.glassBorder, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: font.medium, fontSize: 14, color: colors.textMid },
});
