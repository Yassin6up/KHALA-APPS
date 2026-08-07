import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import {
  ArrowRight, Gift, Link2, Share2, Users, CheckCircle, Copy, Check,
  Smartphone, ArrowUpRight,
} from 'lucide-react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { colors, font, radii, spacing } from '../src/theme';
import { useTranslation } from 'react-i18next';

type ReferralData = { code: string; totalReferrals: number; paidReferrals: number };

export default function Referrals() {
  const { t, i18n } = useTranslation();
  
  const STEPS = [
    { num: '1', icon: Link2,       color: '#3B82F6', title: t('referrals.s1Title'), desc: t('referrals.s1Desc') },
    { num: '2', icon: Smartphone,  color: '#A855F7', title: t('referrals.s2Title'), desc: t('referrals.s2Desc') },
    { num: '3', icon: Gift,        color: '#F59E0B', title: t('referrals.s3Title'), desc: t('referrals.s3Desc') },
  ];

  const [data, setData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<ReferralData>('/referrals/my-code').then(setData).catch(() => null);
  }, []);

  async function copyCode() {
    if (!data?.code) return;
    try {
      await Clipboard.setStringAsync(data.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('', data.code);
    }
  }

  async function shareCode() {
    if (!data?.code) return;
    await Share.share({
      message: t('referrals.shareMsg', { code: data.code }),
      title: t('referrals.shareTitle'),
    });
  }

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={[styles.header, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <ArrowRight size={22} color={colors.textMid} style={{ transform: [{ scaleX: i18n.dir() === 'rtl' ? -1 : 1 }] }} />
          </Pressable>
          <Text style={[styles.headerTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('referrals.title')}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Hero ── */}
          <GlassCard style={styles.hero} intensity={60}>
            <View style={styles.heroIconWrap}>
              <Gift size={40} color={colors.brand} />
            </View>
            <Text style={styles.heroTitle}>{t('referrals.heroTitle')}</Text>
            <Text style={styles.heroSub}>{t('referrals.heroSub')}</Text>
          </GlassCard>

          {/* ── Code card ── */}
          <GlassCard style={styles.codeCard} intensity={55}>
            <Text style={styles.codeLabel}>{t('referrals.codeLabel')}</Text>
            <Text style={styles.code}>{data?.code ?? '...'}</Text>
            <View style={[styles.codeActions, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
              <Pressable onPress={copyCode} style={[styles.actionBtn, styles.copyBtn, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                {copied ? <Check size={16} color={colors.brand} /> : <Copy size={16} color={colors.textMid} />}
                <Text style={styles.copyText}>{copied ? t('referrals.copied') : t('referrals.copy')}</Text>
              </Pressable>
              <Pressable onPress={shareCode} style={[styles.actionBtn, styles.shareBtn, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                <Share2 size={16} color="#fff" />
                <Text style={styles.shareText}>{t('referrals.share')}</Text>
              </Pressable>
            </View>
          </GlassCard>

          {/* ── Stats ── */}
          <GlassCard style={[styles.statsRow, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
            {[
              { icon: Users,       color: '#3B82F6', label: t('referrals.totalInvites'), val: data?.totalReferrals ?? 0 },
              { icon: CheckCircle, color: '#22C55E', label: t('referrals.subscribed'), val: data?.paidReferrals ?? 0 },
              { icon: Gift,        color: '#F59E0B', label: t('referrals.rewards'), val: 0 },
            ].map((s, i) => (
              <View key={s.label} style={[styles.stat, i < 2 && (i18n.dir() === 'rtl' ? styles.statBorderRTL : styles.statBorderLTR)]}>
                <s.icon size={22} color={s.color} />
                <Text style={styles.statVal}>{i18n.language === 'ar' ? s.val.toLocaleString('ar-EG') : s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </GlassCard>

          {/* ── How it works ── */}
          <Text style={[styles.howTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('referrals.howItWorks')}</Text>
          {STEPS.map((s) => (
            <GlassCard key={s.num} style={[styles.stepCard, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
              <View style={[styles.stepIconWrap, { backgroundColor: s.color + '18' }]}>
                <s.icon size={22} color={s.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{s.title}</Text>
                <Text style={[styles.stepDesc, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{s.desc}</Text>
              </View>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i18n.language === 'ar' ? Number(s.num).toLocaleString('ar-EG') : s.num}</Text>
              </View>
            </GlassCard>
          ))}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontFamily: font.bold, fontSize: 22, color: colors.textHi, textAlign: 'right' },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  heroIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: 'rgba(46,197,182,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: font.bold, fontSize: 20, color: colors.textHi, textAlign: 'center' },
  heroSub: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', lineHeight: 22 },
  codeCard: { alignItems: 'center', gap: spacing.md },
  codeLabel: { fontFamily: font.regular, color: colors.textLo, fontSize: 14 },
  code: { fontFamily: font.bold, fontSize: 32, color: colors.brand, letterSpacing: 4 },
  codeActions: { flexDirection: 'row', gap: spacing.md, width: '100%' },
  actionBtn: { flex: 1, height: 48, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  copyBtn: { backgroundColor: colors.bg2, borderWidth: 1, borderColor: colors.glassBorder },
  copyText: { fontFamily: font.bold, color: colors.textHi, fontSize: 14 },
  shareBtn: { backgroundColor: colors.brand },
  shareText: { fontFamily: font.bold, color: '#fff', fontSize: 14 },
  statsRow: {},
  stat: { flex: 1, alignItems: 'center', gap: 6 },
  statBorderRTL: { borderLeftWidth: 1, borderLeftColor: colors.glassBorder },
  statBorderLTR: { borderRightWidth: 1, borderRightColor: colors.glassBorder },
  statVal: { fontFamily: font.bold, fontSize: 24, color: colors.brand },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'center' },
  howTitle: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  stepCard: { alignItems: 'center', gap: spacing.md },
  stepIconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { width: 28, height: 28, borderRadius: 28, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  stepTitle: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  stepDesc: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, marginTop: 2, lineHeight: 18 },
});
