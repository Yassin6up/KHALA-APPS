import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, Image,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api, BASE as API_BASE } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';
import {
  PlayCircle, FileText, Image as ImageIcon, Lock,
  ChevronLeft, DownloadCloud, Crown, User,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

const MEDIA_BASE = (API_BASE ?? 'http://localhost:4000/v1').replace('/v1', '');

function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes('://localhost')) return url.replace(/https?:\/\/localhost:\d+/, MEDIA_BASE);
  if (url.startsWith('http')) return url;
  return `${MEDIA_BASE}${url}`;
}

type Coach = { id: string; nameAr: string; avatarUrl: string | null };
type Asset = {
  id: string; type: string; titleAr: string; duration?: number;
  sizeBytes?: number; isDownloadable: boolean; requiredEntitlement?: string;
  coverUrl?: string | null; coach?: Coach | null;
};
type Plan = { id: string; nameAr: string; priceMinor: number; currency: string; audience: string };
type Filter = 'الكل' | 'فيديو' | 'PDF' | 'تمارين';

const FILTER_MAP: Record<Filter, string | null> = {
  'الكل': null, 'فيديو': 'video', 'PDF': 'pdf', 'تمارين': 'material',
};

const ASSET_ICONS: Record<string, React.FC<any>> = {
  video: PlayCircle, pdf: FileText, material: FileText, image: ImageIcon,
};

function fmtDuration(sec?: number, unitStr = 'د'): string {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  return `${m} ${unitStr}`;
}

function priceLabel(plan: Plan, perMonthStr = 'شهر') {
  const val = (plan.priceMinor / 1000).toFixed(plan.priceMinor % 1000 === 0 ? 0 : 3);
  return `${val} ${plan.currency}/${perMonthStr}`;
}

export default function Library() {
  const { t, i18n } = useTranslation();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [entitlements, setEntitlements] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>('الكل');
  const [loading, setLoading] = useState(true);

  const isLoggedIn = authStore.isLoggedIn();

  useEffect(() => {
    api<Asset[]>('/library')
      .then(setAssets)
      .catch(() => [])
      .finally(() => setLoading(false));

    api<Plan[]>('/billing/plans').then(setPlans).catch(() => []);

    if (isLoggedIn) {
      api<{ features: string[] }>('/billing/me').then((r) => setEntitlements(r.features ?? [])).catch(() => []);
    }
  }, [isLoggedIn]);

  const FILTERS: Filter[] = [t('library.filterAll') as Filter, t('library.filterVideo') as Filter, t('library.filterPdf') as Filter, t('library.filterExercise') as Filter];

  const filtered = filter === t('library.filterAll') ? assets : assets.filter((a) => {
    if (filter === t('library.filterVideo')) return a.type === 'video';
    if (filter === t('library.filterPdf')) return a.type === 'pdf';
    if (filter === t('library.filterExercise')) return a.type === 'material';
    return true;
  });
  const free = filtered.filter((a) => !a.requiredEntitlement);
  const premium = filtered.filter((a) => !!a.requiredEntitlement);
  const hasLibraryAccess = entitlements.includes('library_premium');

  // Cheapest plan that unlocks library_premium
  const cheapestPlan = plans
    .filter((p) => ['individual', 'trainer_family', 'organization'].includes(p.audience))
    .sort((a, b) => a.priceMinor - b.priceMinor)[0];

  function goToAsset(id: string) {
    if (!isLoggedIn) { router.push('/login' as never); return; }
    router.push(`/library/${id}` as never);
  }

  function AssetRow({ asset, locked }: { asset: Asset; locked: boolean }) {
    const Icon = ASSET_ICONS[asset.type] || FileText;
    const coverUri = mediaUrl(asset.coverUrl);

    return (
      <Pressable onPress={() => goToAsset(asset.id)}>
        <GlassCard style={[styles.assetRow, locked && styles.premiumRow]}>
          <View style={[styles.assetThumb, locked && { backgroundColor: 'rgba(233,196,106,0.12)' }]}>
            {coverUri ? (
              <Image source={{ uri: coverUri }} style={styles.thumbImage} />
            ) : (
              <Icon size={24} color={locked ? colors.gold : colors.brand} />
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.assetTitle} numberOfLines={2}>{asset.titleAr}</Text>
            <View style={styles.assetMeta}>
              {asset.coach && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <User size={11} color={colors.brand} />
                  <Text style={[styles.metaText, { color: colors.brand }]}>{asset.coach.nameAr}</Text>
                </View>
              )}
              <Text style={styles.metaText}>
                {asset.type === 'video' ? `${t('library.videoType')}${asset.duration ? ` · ${fmtDuration(asset.duration, t('library.min'))}` : ''}` :
                 asset.type === 'pdf' ? t('library.pdfType') : t('library.exerciseType')}
              </Text>
              {asset.isDownloadable && !locked && (
                <View style={[styles.dlBadge, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                  <DownloadCloud size={10} color={colors.brand} />
                  <Text style={styles.dlText}>{t('library.download')}</Text>
                </View>
              )}
            </View>
          </View>
          {locked ? <Lock size={18} color={colors.gold} /> : <ChevronLeft size={20} color={colors.textLo} style={{ transform: [{ scaleX: i18n.dir() === 'rtl' ? 1 : -1 }] }} />}
        </GlassCard>
      </Pressable>
    );
  }

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.root} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.h1, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('library.title')}</Text>
          <Text style={[styles.sub, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('library.sub')}</Text>
        </View>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, filter === f && styles.chipActive]}>
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Free section */}
        {loading ? (
          [1, 2, 3].map((i) => <GlassCard key={i} style={styles.skeletonCard} />)
        ) : (
          <>
            {free.length > 0 && (
              <>
                <View style={[styles.sectionLabel, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                  <View style={styles.freeBadge}><Text style={styles.freeBadgeText}>{t('library.free')}</Text></View>
                  <Text style={[styles.sectionTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('library.freeContent')}</Text>
                </View>
                {free.map((a) => <AssetRow key={a.id} asset={a} locked={false} />)}
              </>
            )}

            {/* Premium section */}
            {premium.length > 0 && (
              <>
                <View style={[styles.sectionLabel, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                  <View style={styles.premiumBadge}><Text style={styles.premiumBadgeText}>{t('library.premiumBadge')}</Text></View>
                  <Text style={[styles.sectionTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('library.exclusiveContent')}</Text>
                </View>

                {premium.map((a) => <AssetRow key={a.id} asset={a} locked={!hasLibraryAccess} />)}

                {/* Subscribe banner — only shown if user doesn't have access */}
                {!hasLibraryAccess && (
                  <GlassCard style={styles.upgradeBanner}>
                    <View style={[styles.upgradeTop, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                      <Crown size={28} color={colors.gold} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.upgradeTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('library.subscribeTitle')}</Text>
                        <Text style={[styles.upgradeSub, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                          {t('library.premiumWaiting', { count: premium.length })}
                          {cheapestPlan ? ` · ${t('library.startsFrom', { price: priceLabel(cheapestPlan, t('library.perMonth')) })}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Pressable onPress={() => router.push('/subscription' as never)} style={styles.upgradeBtn}>
                      <Text style={styles.upgradeBtnText}>{t('library.viewPlans')}</Text>
                    </Pressable>
                  </GlassCard>
                )}
              </>
            )}

            {assets.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>{t('library.noContent')}</Text>
              </View>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: spacing.sm, gap: spacing.md },
  header: { marginTop: spacing.sm, marginBottom: spacing.sm },
  h1: { fontFamily: font.bold, fontSize: 24, color: colors.textHi, textAlign: 'right' },
  sub: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'right', marginTop: 4 },

  filters: { gap: 8, paddingRight: 4 },
  chip: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 999, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontFamily: font.medium, color: colors.textMid, fontSize: 13 },
  chipTextActive: { color: '#06121f' },

  sectionLabel: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-end' },
  sectionTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  freeBadge: { backgroundColor: 'rgba(72,213,151,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  freeBadgeText: { fontFamily: font.bold, fontSize: 11, color: colors.success },
  premiumBadge: { backgroundColor: 'rgba(233,196,106,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  premiumBadgeText: { fontFamily: font.bold, fontSize: 11, color: colors.gold },

  skeletonCard: { height: 76 },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  premiumRow: { opacity: 0.8, borderColor: 'rgba(233,196,106,0.4)' },
  assetThumb: {
    width: 60, height: 60, borderRadius: radii.sm, overflow: 'hidden',
    backgroundColor: 'rgba(46,197,182,0.12)', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  thumbImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  assetTitle: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  assetMeta: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' },
  metaText: { fontFamily: font.regular, fontSize: 12, color: colors.textLo },
  dlBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(46,197,182,0.12)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  dlText: { fontFamily: font.medium, fontSize: 11, color: colors.brand },

  upgradeBanner: { borderColor: 'rgba(233,196,106,0.4)', gap: spacing.sm },
  upgradeTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  upgradeTitle: { fontFamily: font.bold, fontSize: 16, color: colors.gold, textAlign: 'right' },
  upgradeSub: { fontFamily: font.regular, fontSize: 12.5, color: colors.textLo, textAlign: 'right', marginTop: 3 },
  upgradeBtn: { backgroundColor: colors.gold, borderRadius: 999, paddingVertical: 13, alignItems: 'center', marginTop: spacing.xs },
  upgradeBtnText: { fontFamily: font.bold, fontSize: 15, color: '#1a0f00' },

  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontFamily: font.regular, fontSize: 15, color: colors.textLo },
});
