import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, spacing, type } from '../src/theme';

/** 3 subscription tiers from the project brief. */
const TIERS = [
  {
    code: 'individual_monthly',
    name: 'الأفراد',
    price: '٣٫٩٠٠',
    tag: null as string | null,
    features: ['المرشد الذكي', 'المكتبة الكاملة', 'المجتمع والتحديات'],
  },
  {
    code: 'trainer_family_monthly',
    name: 'المدربين والعائلات',
    price: '٩٫٩٠٠',
    tag: 'الأكثر شيوعاً',
    features: ['كل مزايا الأفراد', 'استشارات ٢٤/٧', 'جلسات فردية مع المدربين'],
  },
  {
    code: 'organization_monthly',
    name: 'المؤسسات',
    price: '٢٩٫٩٠٠',
    tag: null,
    features: ['مجموعات مغلقة', 'لوحة تحكم وتقارير', 'تدريب الموظفين'],
  },
];

export default function Paywall() {
  const router = useRouter();
  const [selected, setSelected] = useState(1);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={[type.display, styles.title]}>اختر اشتراكك</Text>
        <Text style={[type.body, styles.subtitle]}>
          ابدأ بتجربة مجانية ٧ أيام، يمكنك الإلغاء في أي وقت.
        </Text>

        {TIERS.map((tier, i) => {
          const active = selected === i;
          return (
            <Pressable key={tier.code} onPress={() => setSelected(i)}>
              <GlassCard style={[styles.tier, active && styles.tierActive]}>
                <View style={styles.tierHead}>
                  <View>
                    <Text style={styles.tierName}>{tier.name}</Text>
                    <Text style={styles.tierPrice}>
                      {tier.price} <Text style={styles.per}>ر.ع / شهرياً</Text>
                    </Text>
                  </View>
                  {tier.tag && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{tier.tag}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.features}>
                  {tier.features.map((f) => (
                    <Text key={f} style={styles.feature}>
                      ✓  {f}
                    </Text>
                  ))}
                </View>
              </GlassCard>
            </Pressable>
          );
        })}

        <View style={styles.footer}>
          <PrimaryButton
            label="ابدأ التجربة المجانية"
            onPress={() => router.replace('/(tabs)')}
          />
          <Text style={styles.restore} onPress={() => router.replace('/(tabs)')}>
            المتابعة بالنسخة المجانية
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.xl, gap: spacing.md },
  title: { textAlign: 'right' },
  subtitle: { textAlign: 'right', marginBottom: spacing.sm },
  tier: { gap: spacing.md },
  tierActive: { borderColor: colors.brand, borderWidth: 1.5 },
  tierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tierName: { fontFamily: font.bold, fontSize: 20, color: colors.textHi, textAlign: 'right' },
  tierPrice: { fontFamily: font.bold, fontSize: 24, color: colors.brand, textAlign: 'right' },
  per: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  badge: { backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontFamily: font.bold, fontSize: 12, color: '#3a2c05' },
  features: { gap: 6 },
  feature: { fontFamily: font.medium, color: colors.textMid, textAlign: 'right', fontSize: 15 },
  footer: { marginTop: spacing.md, gap: spacing.md },
  restore: { fontFamily: font.medium, color: colors.textLo, textAlign: 'center' },
});
