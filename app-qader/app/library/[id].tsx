import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as WebBrowser from 'expo-web-browser';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';
import {
  PlayCircle, FileText, Lock, ChevronRight,
  Download, Bookmark, Check, PartyPopper, User,
  Eye, ExternalLink, Crown,
} from 'lucide-react-native';

const BASE = 'http://192.168.2.161:4000';

type Coach = { id: string; nameAr: string; avatarUrl: string | null; specialtyAr: string | null };
type Asset = {
  id: string; type: string; titleAr: string; descAr: string | null;
  url: string | null; coverUrl: string | null;
  duration?: number; isDownloadable: boolean;
  requiredEntitlement?: string; canAccess: boolean; progress?: number;
  coach?: Coach | null;
};

function fmtDuration(sec?: number) {
  if (!sec) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const TYPE_LABEL: Record<string, string> = { video: 'فيديو', pdf: 'ملف PDF', material: 'تمرين', image: 'صورة' };

function VideoPlayer({ url, onProgress }: { url: string; onProgress: (pct: number) => void }) {
  const resolved = url.startsWith('http') ? url : `${BASE}${url}`;
  const player = useVideoPlayer({ uri: resolved });
  const [hasError, setHasError] = useState(false);
  const lastReported = useRef(0);

  useEffect(() => {
    player.loop = false;
  }, [player]);

  useEffect(() => {
    const sub = player.addListener('statusChange', (evt: any) => {
      if (evt.status === 'error') setHasError(true);
    });
    const timeSub = player.addListener('timeUpdate', (evt: any) => {
      if (!player.duration || player.duration === 0) return;
      const pct = Math.round((evt.currentTime / player.duration) * 100);
      if (pct > lastReported.current && pct % 10 === 0) {
        lastReported.current = pct;
        onProgress(pct);
      }
    });
    return () => { sub.remove(); timeSub.remove(); };
  }, [player]);

  if (hasError) {
    return (
      <View style={vpStyles.error}>
        <Text style={{ color: colors.danger, fontFamily: font.medium, textAlign: 'center' }}>
          تعذّر تشغيل الفيديو. تأكد من الاتصال بالشبكة.
        </Text>
      </View>
    );
  }

  return (
    <VideoView
      player={player}
      style={vpStyles.video}
      allowsFullscreen
      allowsPictureInPicture
      nativeControls
    />
  );
}

const vpStyles = StyleSheet.create({
  video: { width: '100%', height: 220, borderRadius: radii.md, backgroundColor: '#000' },
  error: { height: 120, alignItems: 'center', justifyContent: 'center', padding: 16 },
});

export default function LibraryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<Asset>(`/library/${id}`)
      .then((a) => { setAsset(a); setProgress(a.progress ?? 0); })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function updateProgress(pct: number) {
    if (!id) return;
    setProgress(pct);
    try { await api(`/library/${id}/progress`, { method: 'PATCH', body: { pct } }); } catch {}
  }

  async function openPdf(url: string) {
    const resolved = url.startsWith('http') ? url : `${BASE}${url}`;
    await WebBrowser.openBrowserAsync(resolved);
  }

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.brand} size="large" />
        </View>
      </GradientBackground>
    );
  }

  if (!asset) {
    return (
      <GradientBackground>
        <View style={styles.loader}>
          <Text style={{ color: colors.textLo }}>لم يُعثر على المحتوى</Text>
        </View>
      </GradientBackground>
    );
  }

  const isLocked = !asset.canAccess;

  return (
    <GradientBackground>
      <View style={styles.root}>
        <SafeAreaView edges={['top']}>
          <View style={styles.nav}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <ChevronRight size={22} color={colors.textMid} />
            </Pressable>
            <Text style={styles.navType}>{TYPE_LABEL[asset.type] ?? asset.type}</Text>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Player / lock card */}
          {isLocked ? (
            <GlassCard style={styles.lockedCard}>
              <Crown size={40} color={colors.gold} />
              <Text style={styles.lockedTitle}>محتوى حصري للمشتركين</Text>
              <Text style={styles.lockedSub}>اشترك في أحد خططنا للوصول إلى هذا المحتوى وأكثر من {'>'}100 محتوى آخر</Text>
              <Pressable onPress={() => router.push('/subscription')} style={styles.subscribeBtn}>
                <Lock size={15} color="#1a0f00" style={{ marginLeft: 4 }} />
                <Text style={styles.subscribeBtnText}>اشترك الآن</Text>
              </Pressable>
            </GlassCard>
          ) : asset.type === 'video' && asset.url ? (
            <VideoPlayer url={asset.url} onProgress={updateProgress} />
          ) : asset.type === 'pdf' && asset.url ? (
            <GlassCard style={styles.pdfCard}>
              <FileText size={40} color={colors.brand} />
              <Text style={styles.pdfTitle}>{asset.titleAr}</Text>
              <Pressable style={styles.openPdfBtn} onPress={() => openPdf(asset.url!)}>
                <ExternalLink size={16} color="#fff" />
                <Text style={styles.openPdfText}>فتح PDF</Text>
              </Pressable>
            </GlassCard>
          ) : (
            <GlassCard style={styles.playerCard}>
              <View style={styles.playerContent}>
                {asset.type === 'video' ? <PlayCircle size={56} color={colors.textHi} /> : <User size={56} color={colors.textHi} />}
                {asset.duration && <Text style={styles.duration}>{fmtDuration(asset.duration)}</Text>}
              </View>
            </GlassCard>
          )}

          {/* Title */}
          <Text style={styles.title}>{asset.titleAr}</Text>
          {asset.descAr && <Text style={styles.desc}>{asset.descAr}</Text>}

          {/* Coach info */}
          {asset.coach && (
            <GlassCard style={styles.coachCard}>
              <View style={styles.coachAvatar}>
                <User size={22} color={colors.brand} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coachName}>{asset.coach.nameAr}</Text>
                {asset.coach.specialtyAr && (
                  <Text style={styles.coachSpec}>{asset.coach.specialtyAr}</Text>
                )}
              </View>
            </GlassCard>
          )}

          {/* Progress (only when accessible) */}
          {!isLocked && (
            <GlassCard style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressPct}>{progress}٪</Text>
                <Text style={styles.progressLabel}>تقدمك في المحتوى</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
              </View>
              <View style={styles.progressBtns}>
                {[25, 50, 75, 100].map((pct) => (
                  <Pressable key={pct} onPress={() => updateProgress(pct)} style={[styles.pctBtn, progress >= pct && styles.pctBtnActive]}>
                    <Text style={[styles.pctBtnText, progress >= pct && styles.pctBtnTextActive]}>{pct}٪</Text>
                  </Pressable>
                ))}
              </View>
            </GlassCard>
          )}

          {/* Actions */}
          {!isLocked && (
            <View style={styles.actions}>
              {asset.type === 'pdf' && asset.url && (
                <Pressable style={styles.actionBtn} onPress={() => openPdf(asset.url!)}>
                  <Eye size={18} color={colors.textMid} />
                  <Text style={styles.actionText}>عرض</Text>
                </Pressable>
              )}
              {asset.isDownloadable && asset.url && (
                <Pressable style={[styles.actionBtn, styles.dlBtn]} onPress={() => openPdf(asset.url!)}>
                  <Download size={18} color={colors.brand} />
                  <Text style={[styles.actionText, { color: colors.brand }]}>تحميل</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn}>
                <Bookmark size={18} color={colors.textMid} />
                <Text style={styles.actionText}>حفظ</Text>
              </Pressable>
            </View>
          )}

          {/* Mark complete */}
          {!isLocked && progress < 100 && (
            <Pressable onPress={() => updateProgress(100)} style={styles.completeBtn}>
              <Check size={18} color="#06121f" />
              <Text style={styles.completeBtnText}>وضّع علامة مكتمل</Text>
            </Pressable>
          )}

          {progress === 100 && (
            <GlassCard style={styles.doneCard}>
              <PartyPopper size={32} color={colors.success} />
              <Text style={styles.doneText}>أكملت هذا المحتوى! استمر في تعلّمك.</Text>
            </GlassCard>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  navType: { fontFamily: font.medium, color: colors.textLo, fontSize: 14 },

  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingBottom: 40, paddingTop: spacing.sm },

  /* Lock */
  lockedCard: { alignItems: 'center', gap: spacing.md, paddingVertical: 32 },
  lockedTitle: { fontFamily: font.bold, fontSize: 20, color: colors.gold, textAlign: 'center' },
  lockedSub: { fontFamily: font.regular, fontSize: 13.5, color: colors.textLo, textAlign: 'center', lineHeight: 20 },
  subscribeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.gold, borderRadius: radii.pill,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: spacing.sm,
  },
  subscribeBtnText: { fontFamily: font.bold, color: '#1a0f00', fontSize: 15 },

  /* PDF card */
  pdfCard: { alignItems: 'center', gap: spacing.md, paddingVertical: 28 },
  pdfTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'center' },
  openPdfBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.brand, borderRadius: radii.pill,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  openPdfText: { fontFamily: font.bold, color: '#06121f', fontSize: 14 },

  /* Generic player card */
  playerCard: { height: 180, overflow: 'hidden' },
  playerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  duration: { fontFamily: font.medium, fontSize: 14, color: colors.textLo },

  /* Content */
  title: { fontFamily: font.bold, fontSize: 20, color: colors.textHi, textAlign: 'right' },
  desc: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'right', lineHeight: 22 },

  /* Coach */
  coachCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  coachAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(46,197,182,0.15)', borderWidth: 1, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center',
  },
  coachName: { fontFamily: font.bold, fontSize: 14, color: colors.textHi, textAlign: 'right' },
  coachSpec: { fontFamily: font.regular, fontSize: 12, color: colors.brand, textAlign: 'right', marginTop: 2 },

  /* Progress */
  progressCard: { gap: spacing.sm },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontFamily: font.medium, fontSize: 14, color: colors.textMid },
  progressPct: { fontFamily: font.bold, fontSize: 18, color: colors.brand },
  progressBar: { height: 6, borderRadius: 6, backgroundColor: colors.glassFill, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 6, backgroundColor: colors.brand },
  progressBtns: { flexDirection: 'row', gap: spacing.sm },
  pctBtn: { flex: 1, height: 36, borderRadius: radii.pill, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  pctBtnActive: { backgroundColor: 'rgba(46,197,182,0.15)', borderColor: colors.brand },
  pctBtnText: { fontFamily: font.medium, fontSize: 13, color: colors.textLo },
  pctBtnTextActive: { color: colors.brand },

  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: { flex: 1, height: 52, borderRadius: radii.md, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center', gap: 4 },
  dlBtn: { borderColor: colors.brand },
  actionText: { fontFamily: font.medium, fontSize: 12, color: colors.textMid },
  completeBtn: { height: 52, borderRadius: radii.pill, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  completeBtnText: { fontFamily: font.bold, color: '#06121f', fontSize: 16 },
  doneCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, borderColor: colors.success },
  doneText: { fontFamily: font.medium, fontSize: 15, color: colors.success, textAlign: 'right', flex: 1 },
});
