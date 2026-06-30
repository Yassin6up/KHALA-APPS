import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Dimensions, Linking, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight, User, Lock, Smartphone, Bell, BellOff, CalendarClock,
  Globe, Sun, BarChart2, Info, FileText, Shield, Star, Trash2,
  ChevronLeft, Check, X, Camera, KeyRound, Eye, EyeOff,
} from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing } from '../src/theme';

const { height: SH } = Dimensions.get('window');

type Me = { user: { fullName?: string; email?: string; phone?: string; avatarUrl?: string } };

// ── Bottom Sheet helper ───────────────────────────────────────────────────

function Sheet({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const anim = useRef(new Animated.Value(SH)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: visible ? 0 : SH, useNativeDriver: true, bounciness: 3 }).start();
  }, [visible]);
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={ss.backdrop} onPress={onClose} />
      <Animated.View style={[ss.sheet, { transform: [{ translateY: anim }] }]}>
        <View style={ss.sheetPill} />
        <View style={ss.sheetHeader}>
          <Pressable onPress={onClose} hitSlop={10}><X size={20} color={colors.textMid} /></Pressable>
          <Text style={ss.sheetTitle}>{title}</Text>
          <View style={{ width: 20 }} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
          {children}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, secure, multiline }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secure?: boolean; multiline?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={ss.fieldLabel}>{label}</Text>
      <View style={ss.fieldWrap}>
        <TextInput
          style={ss.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLo}
          secureTextEntry={secure && !show}
          multiline={multiline}
          textAlign="right"
        />
        {secure && (
          <Pressable onPress={() => setShow(v => !v)} style={{ padding: 4 }}>
            {show ? <EyeOff size={18} color={colors.textLo} /> : <Eye size={18} color={colors.textLo} />}
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────

export default function Settings() {
  const [me, setMe] = useState<Me | null>(null);

  // Notification toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [communityNotifs, setCommunityNotifs] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(true);

  // Modals
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Edit profile form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [saving, setSaving] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);

  useEffect(() => {
    api<Me>('/me').then((d) => {
      setMe(d);
      setEditName(d.user.fullName ?? '');
      setEditEmail(d.user.email ?? '');
      setEditAvatar(d.user.avatarUrl ?? '');
    }).catch(() => {});
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api('/me', {
        method: 'PATCH',
        body: { fullName: editName, avatarUrl: editAvatar || undefined },
      });
      setMe(prev => prev ? { user: { ...prev.user, fullName: editName, avatarUrl: editAvatar } } : null);
      setShowProfile(false);
      Alert.alert('تم', 'تم تحديث ملفك الشخصي');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشل الحفظ');
    } finally {
      setSaving(false);
    }
  }

  async function savePassword() {
    if (!newPwd || newPwd !== confirmPwd) {
      Alert.alert('خطأ', 'كلمتا المرور غير متطابقتين');
      return;
    }
    if (newPwd.length < 6) {
      Alert.alert('خطأ', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setPwdSaving(true);
    try {
      await api('/me/password', {
        method: 'PATCH',
        body: { currentPassword: currentPwd, newPassword: newPwd },
      });
      setShowPassword(false);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشل تغيير كلمة المرور');
    } finally {
      setPwdSaving(false);
    }
  }

  const TOGGLES = [
    { icon: Bell, label: 'إشعارات عامة', sub: 'تفعيل/إيقاف جميع الإشعارات', value: pushNotifs, onChange: setPushNotifs },
    { icon: CalendarClock, label: 'تذكيرات المهام', sub: 'تذكير يومي بمهام خطتك', value: taskReminders, onChange: setTaskReminders },
    { icon: BellOff, label: 'إشعارات المجتمع', sub: 'الردود والمشاركات الجديدة', value: communityNotifs, onChange: setCommunityNotifs },
    { icon: BarChart2, label: 'التقرير الأسبوعي', sub: 'ملخص أسبوعي لتقدمك', value: weeklyReport, onChange: setWeeklyReport },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.root}>
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
              <ArrowRight size={22} color={colors.textMid} />
            </Pressable>
            <Text style={styles.headerTitle}>الإعدادات</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Account ── */}
            <Text style={styles.sectionLabel}>الحساب</Text>
            <GlassCard style={{ gap: 4 }}>
              {[
                { icon: User, label: 'تعديل الملف الشخصي', onPress: () => setShowProfile(true) },
                { icon: KeyRound, label: 'الأمان وكلمة المرور', onPress: () => setShowPassword(true) },
                { icon: Smartphone, label: 'الأجهزة المرتبطة', onPress: () => {} },
              ].map((row, i) => (
                <Pressable key={row.label} onPress={row.onPress}
                  style={[styles.menuRow, i > 0 && styles.rowBorder]}>
                  <ChevronLeft size={18} color={colors.textLo} />
                  <Text style={styles.menuLabel}>{row.label}</Text>
                  <View style={styles.menuIconWrap}>
                    <row.icon size={18} color={colors.brand} />
                  </View>
                </Pressable>
              ))}
            </GlassCard>

            {/* ── Notifications ── */}
            <Text style={styles.sectionLabel}>الإشعارات</Text>
            <GlassCard style={{ gap: 0 }}>
              {TOGGLES.map((t, i) => (
                <View key={t.label} style={[styles.toggleRow, i > 0 && styles.rowBorder]}>
                  <Switch
                    value={t.value}
                    onValueChange={t.onChange}
                    trackColor={{ false: colors.glassBorder, true: colors.brand }}
                    thumbColor="#fff"
                    ios_backgroundColor={colors.bg2}
                  />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.toggleLabel}>{t.label}</Text>
                    <Text style={styles.toggleSub}>{t.sub}</Text>
                  </View>
                  <View style={[styles.menuIconWrap, { backgroundColor: 'rgba(46,197,182,0.08)' }]}>
                    <t.icon size={16} color={colors.brand} />
                  </View>
                </View>
              ))}
            </GlassCard>

            {/* ── App ── */}
            <Text style={styles.sectionLabel}>التطبيق</Text>
            <GlassCard style={{ gap: 4 }}>
              {[
                { icon: Globe, label: 'اللغة', val: 'العربية' },
                { icon: Sun, label: 'المظهر', val: 'فاتح' },
                { icon: BarChart2, label: 'بيانات الاستخدام', val: 'مفعّل' },
              ].map((row, i) => (
                <View key={row.label} style={[styles.menuRow, i > 0 && styles.rowBorder]}>
                  <Text style={styles.menuVal}>{row.val}</Text>
                  <Text style={styles.menuLabel}>{row.label}</Text>
                  <View style={styles.menuIconWrap}>
                    <row.icon size={18} color={colors.textMid} />
                  </View>
                </View>
              ))}
            </GlassCard>

            {/* ── About ── */}
            <Text style={styles.sectionLabel}>حول التطبيق</Text>
            <GlassCard style={{ gap: 4 }}>
              <View style={[styles.menuRow]}>
                <Text style={styles.menuVal}>١.٠.٠</Text>
                <Text style={styles.menuLabel}>إصدار التطبيق</Text>
                <View style={styles.menuIconWrap}><Info size={18} color={colors.textMid} /></View>
              </View>
              {[
                { icon: Shield, label: 'سياسة الخصوصية', url: 'https://khala.app/privacy' },
                { icon: FileText, label: 'شروط الاستخدام', url: 'https://khala.app/terms' },
                { icon: Star, label: 'قيّم التطبيق', url: Platform.OS === 'ios' ? 'https://apps.apple.com' : 'https://play.google.com' },
              ].map((row, i) => (
                <Pressable key={row.label} onPress={() => Linking.openURL(row.url).catch(() => {})}
                  style={[styles.menuRow, styles.rowBorder]}>
                  <ChevronLeft size={18} color={colors.textLo} />
                  <Text style={styles.menuLabel}>{row.label}</Text>
                  <View style={styles.menuIconWrap}>
                    <row.icon size={18} color={colors.textMid} />
                  </View>
                </Pressable>
              ))}
            </GlassCard>

            {/* ── Danger ── */}
            <Text style={[styles.sectionLabel, { color: colors.danger }]}>منطقة الخطر</Text>
            <Pressable onPress={() => router.push('/delete-account')}>
              <GlassCard style={styles.dangerCard}>
                <Trash2 size={20} color={colors.danger} />
                <Text style={styles.dangerText}>حذف الحساب نهائياً</Text>
                <ChevronLeft size={18} color={colors.danger} />
              </GlassCard>
            </Pressable>

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* ── Edit Profile Sheet ── */}
      <Sheet visible={showProfile} onClose={() => setShowProfile(false)} title="تعديل الملف الشخصي">
        <View style={ss.avatarRow}>
          <View style={ss.avatarCircle}>
            <User size={32} color={colors.brand} />
          </View>
          <Text style={ss.avatarHint}>أدخل رابط صورة الملف الشخصي أدناه</Text>
        </View>
        <Field label="الاسم الكامل" value={editName} onChangeText={setEditName} placeholder="أدخل اسمك" />
        <Field label="رابط الصورة الشخصية" value={editAvatar} onChangeText={setEditAvatar} placeholder="https://..." />
        <Text style={ss.emailNote}>البريد الإلكتروني: {me?.user.email ?? '—'} (غير قابل للتغيير)</Text>
        <Pressable onPress={saveProfile} disabled={saving} style={[ss.saveBtn, saving && { opacity: 0.6 }]}>
          <Check size={18} color="#fff" />
          <Text style={ss.saveBtnText}>{saving ? 'جارٍ الحفظ…' : 'حفظ التغييرات'}</Text>
        </Pressable>
      </Sheet>

      {/* ── Change Password Sheet ── */}
      <Sheet visible={showPassword} onClose={() => setShowPassword(false)} title="تغيير كلمة المرور">
        <Field label="كلمة المرور الحالية" value={currentPwd} onChangeText={setCurrentPwd} secure placeholder="••••••••" />
        <Field label="كلمة المرور الجديدة" value={newPwd} onChangeText={setNewPwd} secure placeholder="٦ أحرف على الأقل" />
        <Field label="تأكيد كلمة المرور الجديدة" value={confirmPwd} onChangeText={setConfirmPwd} secure placeholder="••••••••" />
        <Pressable onPress={savePassword} disabled={pwdSaving} style={[ss.saveBtn, pwdSaving && { opacity: 0.6 }]}>
          <Lock size={18} color="#fff" />
          <Text style={ss.saveBtnText}>{pwdSaving ? 'جارٍ الحفظ…' : 'تغيير كلمة المرور'}</Text>
        </Pressable>
      </Sheet>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: font.bold, fontSize: 20, color: colors.textHi, textAlign: 'right' },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: 40 },
  sectionLabel: { fontFamily: font.bold, fontSize: 12, color: colors.textLo, textAlign: 'right', marginTop: spacing.sm, letterSpacing: 0.5, textTransform: 'uppercase' },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: spacing.sm },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.glassBorder },
  menuLabel: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  menuVal: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  menuIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 10 },
  toggleLabel: { fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  toggleSub: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right' },
  dangerCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: 'rgba(239,68,68,0.25)' },
  dangerText: { flex: 1, fontFamily: font.medium, fontSize: 15, color: colors.danger, textAlign: 'right' },
});

const ss = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: SH * 0.88, backgroundColor: colors.bg1, borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  sheetPill: { width: 40, height: 4, borderRadius: 4, backgroundColor: colors.glassBorder, alignSelf: 'center', marginTop: 10 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  sheetTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm },
  avatarCircle: { width: 64, height: 64, borderRadius: 64, backgroundColor: 'rgba(46,197,182,0.10)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(46,197,182,0.25)', borderStyle: 'dashed' },
  avatarHint: { flex: 1, fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', lineHeight: 18 },
  fieldLabel: { fontFamily: font.medium, fontSize: 13, color: colors.textMid, textAlign: 'right' },
  fieldWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg2, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.glassBorder, paddingHorizontal: spacing.md },
  fieldInput: { flex: 1, fontFamily: font.regular, fontSize: 15, color: colors.textHi, paddingVertical: 12 },
  emailNote: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.brand, borderRadius: radii.pill, paddingVertical: 14 },
  saveBtnText: { fontFamily: font.bold, fontSize: 16, color: '#fff' },
});
