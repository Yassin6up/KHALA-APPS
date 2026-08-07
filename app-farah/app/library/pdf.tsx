import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { ChevronRight, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { colors, font, spacing } from '../../src/theme';
import { GradientBackground } from '../../src/components/GradientBackground';

const BASE = 'http://192.168.2.161:4000';

export default function PdfViewerScreen() {
  const { url: rawUrl, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const webRef = useRef<WebView>(null);

  const pdfUrl = rawUrl
    ? (rawUrl.startsWith('http') ? rawUrl : `${BASE}${rawUrl}`)
    : '';

  // Embed using Google Docs viewer for remote PDFs
  const viewerUrl = `https://docs.google.com/gviewer?embedded=true&url=${encodeURIComponent(pdfUrl)}`;

  async function handleDownload() {
    try {
      setDownloading(true);
      const fileName = `${title ?? 'document'}.pdf`;
      const dest = FileSystem.documentDirectory + fileName;
      const dl = FileSystem.createDownloadResumable(pdfUrl, dest, {}, (snap) => {
        setProgress(snap.totalBytesWritten / (snap.totalBytesExpectedToWrite || 1));
      });
      const result = await dl.downloadAsync();
      if (result?.uri && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(result.uri);
      }
    } catch (e) {
      console.warn('Download failed', e);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  }

  if (!pdfUrl) {
    return (
      <GradientBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textLo }}>رابط الملف غير متوفر</Text>
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        {/* Navbar */}
        <View style={S.nav}>
          <Pressable onPress={() => router.back()} style={S.backBtn}>
            <ChevronRight size={22} color={colors.textMid} />
          </Pressable>
          <Text style={S.navTitle} numberOfLines={1}>{title ?? 'عرض PDF'}</Text>
          <Pressable onPress={handleDownload} style={S.actionBtn} disabled={downloading}>
            {downloading
              ? <ActivityIndicator size="small" color={colors.brand} />
              : <Download size={20} color={colors.brand} />}
          </Pressable>
        </View>

        {/* Download progress */}
        {downloading && (
          <View style={S.progressWrap}>
            <View style={[S.progressBar, { width: `${Math.round(progress * 100)}%` as any }]} />
          </View>
        )}

        {/* PDF WebView */}
        <View style={{ flex: 1 }}>
          <WebView
            ref={webRef}
            source={{ uri: viewerUrl }}
            style={{ flex: 1, backgroundColor: '#1a2035' }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState
            renderLoading={() => (
              <View style={S.loader}>
                <ActivityIndicator size="large" color={colors.brand} />
                <Text style={S.loaderText}>جارٍ تحميل الملف…</Text>
              </View>
            )}
          />
          {loading && (
            <View style={[S.loader, StyleSheet.absoluteFillObject]}>
              <ActivityIndicator size="large" color={colors.brand} />
              <Text style={S.loaderText}>جارٍ تحميل الملف…</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const S = StyleSheet.create({
  nav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  navTitle: {
    flex: 1, fontFamily: font.bold, fontSize: 15, color: colors.textHi,
    textAlign: 'center', marginHorizontal: 8,
  },
  actionBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  progressWrap: {
    height: 3, backgroundColor: colors.glassBorder, marginHorizontal: spacing.lg,
  },
  progressBar: {
    height: 3, backgroundColor: colors.brand, borderRadius: 3,
  },
  loader: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, backgroundColor: '#0B1020',
  },
  loaderText: { fontFamily: font.medium, color: colors.textLo, fontSize: 13 },
});
