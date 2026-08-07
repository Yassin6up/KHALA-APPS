import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../../../src/components/GlassCard';
import { GradientBackground } from '../../../src/components/GradientBackground';
import { Header } from '../../../src/components/Header';
import { api } from '../../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../../src/theme';
import { CheckCircle, CreditCard, Banknote, ShieldCheck } from 'lucide-react-native';

type BazarItemDetails = {
  id: string;
  titleAr: string;
  priceMinor: number;
  coverUrl: string;
};

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<BazarItemDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState<'card' | 'cod'>('card');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api<BazarItemDetails>(`/bazar/${id}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  async function pay() {
    setProcessing(true);
    // Simulate delay for payment processing
    setTimeout(async () => {
      try {
        await api(`/bazar/${id}/book`, { method: 'POST' });
        setSuccess(true);
      } catch (e) {
        Alert.alert('خطأ', 'حدث خطأ أثناء إتمام الدفع');
      } finally {
        setProcessing(false);
      }
    }, 1500);
  }

  if (loading || !data) {
    return (
      <GradientBackground>
        <Header title="إتمام الطلب" />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      </GradientBackground>
    );
  }

  if (success) {
    return (
      <GradientBackground>
        <Header title="" />
        <View style={styles.successContainer}>
          <CheckCircle size={80} color={colors.success} />
          <Text style={[type.h2, { marginTop: spacing.md, textAlign: 'center' }]}>
            تم تأكيد الطلب والدفع بنجاح!
          </Text>
          <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm, color: colors.textMid }]}>
            سيقوم صانع المحتوى بالتواصل معك قريباً.
          </Text>
          <Pressable
            style={[styles.btn, { marginTop: spacing.xl, width: '100%' }]}
            onPress={() => router.replace('/bazar')}
          >
            <Text style={styles.btnText}>العودة للسوق</Text>
          </Pressable>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Header title="إتمام الطلب والدفع" />
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        
        <GlassCard style={styles.summaryCard}>
          <Text style={type.h3}>ملخص الطلب</Text>
          <View style={styles.itemRow}>
            <Image source={{ uri: data.coverUrl }} style={styles.itemImage} />
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.itemTitle} numberOfLines={2}>{data.titleAr}</Text>
              <Text style={styles.itemPrice}>{(data.priceMinor / 1000).toFixed(0)} ر.ع</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.paymentCard}>
          <Text style={type.h3}>طريقة الدفع</Text>
          <Text style={[type.body, { color: colors.textLo, fontSize: 12, marginBottom: spacing.sm }]}>
            اختر وسيلة الدفع المفضلة لديك:
          </Text>

          <Pressable
            style={[styles.methodBtn, method === 'card' && styles.methodBtnActive]}
            onPress={() => setMethod('card')}
          >
            <View style={styles.methodIconBox}>
              <CreditCard size={24} color={method === 'card' ? '#fff' : colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, method === 'card' && styles.methodTitleActive]}>
                {Platform.OS === 'ios' ? 'Apple Pay / بطاقة ائتمان' : 'بطاقة ائتمان / Stripe'}
              </Text>
              <Text style={[styles.methodDesc, method === 'card' && styles.methodDescActive]}>
                دفع إلكتروني آمن وسريع
              </Text>
            </View>
            {method === 'card' && <CheckCircle size={20} color="#fff" />}
          </Pressable>

          <Pressable
            style={[styles.methodBtn, method === 'cod' && styles.methodBtnActive]}
            onPress={() => setMethod('cod')}
          >
            <View style={styles.methodIconBox}>
              <Banknote size={24} color={method === 'cod' ? '#fff' : colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.methodTitle, method === 'cod' && styles.methodTitleActive]}>
                الدفع نقداً أو لاحقاً (COD)
              </Text>
              <Text style={[styles.methodDesc, method === 'cod' && styles.methodDescActive]}>
                الدفع عند الاستلام أو الاتفاق
              </Text>
            </View>
            {method === 'cod' && <CheckCircle size={20} color="#fff" />}
          </Pressable>
          
          <View style={styles.secureRow}>
            <ShieldCheck size={16} color={colors.textLo} />
            <Text style={styles.secureText}>مدفوعاتك محمية وآمنة عبر Stripe</Text>
          </View>
        </GlassCard>

        <Pressable style={styles.btn} onPress={pay} disabled={processing}>
          {processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              تأكيد الدفع ({(data.priceMinor / 1000).toFixed(0)} ر.ع)
            </Text>
          )}
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md },
  summaryCard: { padding: spacing.md, gap: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  itemImage: { width: 60, height: 60, borderRadius: radii.md, backgroundColor: colors.glassFillStrong },
  itemTitle: { fontFamily: font.medium, fontSize: 14, color: colors.textHi },
  itemPrice: { fontFamily: font.bold, fontSize: 16, color: colors.brand },
  paymentCard: { padding: spacing.md, gap: spacing.sm },
  methodBtn: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.glassFill, gap: spacing.md },
  methodBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  methodIconBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  methodTitle: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  methodTitleActive: { color: '#fff' },
  methodDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  methodDescActive: { color: 'rgba(255,255,255,0.8)' },
  secureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: spacing.md },
  secureText: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  btn: { backgroundColor: colors.brand, padding: spacing.md, borderRadius: radii.md, alignItems: 'center', marginTop: spacing.md },
  btnText: { fontFamily: font.bold, color: '#fff', fontSize: 16 },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
});
