import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, spacing, type } from '../src/theme';
import { useTranslation } from 'react-i18next';

export default function Paywall() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  /** 3 subscription tiers from the project brief. */
  const TIERS = [
    {
      code: 'individual_monthly',
      name: t('paywall.tier1Name'),
      price: t('paywall.tier1Price'),
      tag: null as string | null,
      features: [t('paywall.tier1F1'), t('paywall.tier1F2'), t('paywall.tier1F3')],
    },
    {
      code: 'trainer_family_monthly',
      name: t('paywall.tier2Name'),
      price: t('paywall.tier2Price'),
      tag: t('paywall.tier2Tag'),
      features: [t('paywall.tier2F1'), t('paywall.tier2F2'), t('paywall.tier2F3')],
    },
    {
      code: 'organization_monthly',
      name: t('paywall.tier3Name'),
      price: t('paywall.tier3Price'),
      tag: null,
      features: [t('paywall.tier3F1'), t('paywall.tier3F2'), t('paywall.tier3F3')],
    },
  ];

  const [selected, setSelected] = useState(1);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={[type.display, styles.title, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('paywall.title')}</Text>
        <Text style={[type.body, styles.subtitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
          {t('paywall.subtitle')}
        </Text>

        {TIERS.map((tier, i) => {
          const active = selected === i;
          return (
            <Pressable key={tier.code} onPress={() => setSelected(i)}>
              <GlassCard style={[styles.tier, active && styles.tierActive]}>
                <View style={[styles.tierHead, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                  <View>
                    <Text style={[styles.tierName, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{tier.name}</Text>
                    <Text style={[styles.tierPrice, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                      {tier.price} <Text style={styles.per}>{t('paywall.perMonth')}</Text>
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
                    <Text key={f} style={[styles.feature, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
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
            label={t('paywall.startTrial')}
            onPress={() => router.replace('/(tabs)')}
          />
          <Text style={styles.restore} onPress={() => router.replace('/(tabs)')}>
            {t('paywall.continueFree')}
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.xl, gap: spacing.md },
  title: {},
  subtitle: { marginBottom: spacing.sm },
  tier: { gap: spacing.md },
  tierActive: { borderColor: colors.brand, borderWidth: 1.5 },
  tierHead: { justifyContent: 'space-between', alignItems: 'flex-start' },
  tierName: { fontFamily: font.bold, fontSize: 20, color: colors.textHi },
  tierPrice: { fontFamily: font.bold, fontSize: 24, color: colors.brand },
  per: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  badge: { backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  badgeText: { fontFamily: font.bold, fontSize: 12, color: '#3a2c05' },
  features: { gap: 6 },
  feature: { fontFamily: font.medium, color: colors.textMid, fontSize: 15 },
  footer: { marginTop: spacing.md, gap: spacing.md },
  restore: { fontFamily: font.medium, color: colors.textLo, textAlign: 'center' },
});
