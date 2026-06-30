import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, MapPin, Phone, FileText, Check, Banknote } from 'lucide-react-native';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

type SavedAddress = { address?: string; phone?: string };

export default function OrderScreen() {
  const { itemId } = useLocalSearchParams<{ itemId: string }>();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Pre-fill saved address
  useEffect(() => {
    api<SavedAddress>('/me/saved-address').then((d) => {
      if (d.address) setAddress(d.address);
      if (d.phone) setPhone(d.phone);
    }).catch(() => null);
  }, []);

  async function submit() {
    if (!address.trim()) { Alert.alert('تنبيه', 'أدخل العنوان'); return; }
    if (!phone.trim()) { Alert.alert('تنبيه', 'أدخل رقم الهاتف'); return; }
    setLoading(true);
    try {
      await api(`/catalog/${itemId}/book`, {
        method: 'POST',
        body: { address: address.trim(), phone: phone.trim(), notes: notes.trim(), paymentMethod: 'cod' },
      });
      setDone(true);
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message.replace(/^API \d+: /, '') : 'حاول مجدداً');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: spacing.lg }}>
          <View style={styles.successIcon}>
            <Check size={36} color="#fff" />
          </View>
          <Text style={styles.successTitle}>تم تأكيد طلبك!</Text>
          <Text style={styles.successSub}>سنتواصل معك قريباً لتأكيد التفاصيل والتسليم</Text>
          <Pressable onPress={() => router.push('/my-orders')} style={styles.successBtn}>
            <Text style={styles.successBtnText}>تتبّع طلبي</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/(tabs)')} style={styles.successSecBtn}>
            <Text style={styles.successSecText}>العودة للرئيسية</Text>
          </Pressable>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView edges={['top']}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>تفاصيل الطلب</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Payment method */}
            <View style={styles.section}>
              <Text style={styles.secTitle}>طريقة الدفع</Text>
              <View style={styles.payCard}>
                <View style={styles.payCardLeft}>
                  <Banknote size={20} color={colors.success} />
                  <View>
                    <Text style={styles.payTitle}>الدفع عند الاستلام</Text>
                    <Text style={styles.paySub}>Cash on Delivery</Text>
                  </View>
                </View>
                <View style={styles.radioActive}><Check size={13} color="#fff" /></View>
              </View>
            </View>

            {/* Shipping info */}
            <View style={styles.section}>
              <Text style={styles.secTitle}>معلومات التوصيل</Text>

              <View style={styles.field}>
                <Text style={styles.label}>العنوان الكامل</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="مثال: مسقط، الخوير، شارع السلطان قابوس..."
                    placeholderTextColor={colors.textLo}
                    value={address}
                    onChangeText={setAddress}
                    textAlign="right"
                    multiline
                  />
                  <View style={styles.inputIcon}><MapPin size={17} color={colors.textLo} /></View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>رقم الهاتف</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="+968 XXXX XXXX"
                    placeholderTextColor={colors.textLo}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    textAlign="right"
                  />
                  <View style={styles.inputIcon}><Phone size={17} color={colors.textLo} /></View>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>ملاحظات إضافية (اختياري)</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, { minHeight: 72 }]}
                    placeholder="أي تفاصيل تود إضافتها..."
                    placeholderTextColor={colors.textLo}
                    value={notes}
                    onChangeText={setNotes}
                    textAlign="right"
                    multiline
                    textAlignVertical="top"
                  />
                  <View style={[styles.inputIcon, { top: 14 }]}><FileText size={17} color={colors.textLo} /></View>
                </View>
              </View>
            </View>

            {/* Info note */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>سيتواصل معك فريقنا خلال 24 ساعة لتأكيد الطلب وترتيب التسليم.</Text>
            </View>

            <PrimaryButton label="تأكيد الطلب" onPress={submit} loading={loading} />

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
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
  scroll: { padding: spacing.lg, gap: 0 },
  section: { marginBottom: spacing.lg },
  secTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right', marginBottom: spacing.sm },
  payCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1.5, borderColor: colors.success,
  },
  payCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  payTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  paySub: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right' },
  radioActive: { width: 22, height: 22, borderRadius: 22, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  field: { marginBottom: spacing.md },
  label: { fontFamily: font.medium, fontSize: 13.5, color: colors.textMid, textAlign: 'right', marginBottom: 8 },
  inputWrap: { position: 'relative' },
  input: {
    borderWidth: 1.5, borderColor: colors.glassBorder, borderRadius: 12,
    paddingHorizontal: spacing.md, paddingVertical: 13, paddingRight: 44,
    color: colors.textHi, fontFamily: font.regular, fontSize: 15,
    backgroundColor: colors.bg1,
  },
  inputIcon: { position: 'absolute', top: 13, right: 14 },
  infoBox: {
    backgroundColor: colors.goldSoft, borderRadius: radii.md, padding: spacing.md,
    borderWidth: 1, borderColor: 'rgba(245,179,1,0.3)', marginBottom: spacing.lg,
  },
  infoText: { fontFamily: font.regular, fontSize: 13, color: '#92400E', textAlign: 'right', lineHeight: 21 },
  successIcon: { width: 80, height: 80, borderRadius: 80, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: font.bold, fontSize: 24, color: colors.textHi },
  successSub: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'center', lineHeight: 22 },
  successBtn: { backgroundColor: colors.brand, borderRadius: radii.pill, paddingHorizontal: 40, height: 52, alignItems: 'center', justifyContent: 'center', width: '100%' },
  successBtnText: { fontFamily: font.bold, fontSize: 16, color: '#fff' },
  successSecBtn: { paddingVertical: 12 },
  successSecText: { fontFamily: font.regular, fontSize: 14, color: colors.textLo },
});
