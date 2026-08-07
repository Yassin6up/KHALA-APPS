import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert, Animated, Image, KeyboardAvoidingView, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { api, BASE as API_BASE } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';
import {
  ChevronRight, Download, FileText, Lock, Crown, BookOpen, User, Play,
  Eye, Bookmark, BookmarkCheck, Star, Video as VideoIcon, Calendar,
  Clock, CheckCircle, X, ChevronLeft, Maximize2,
} from 'lucide-react-native';

const MEDIA_BASE = (API_BASE ?? 'http://192.168.2.161:4000/v1').replace('/v1', '');

type Coach = {
  id: string; nameAr: string; avatarUrl: string | null;
  specialtyAr: string | null; bioAr?: string | null; priceSAR?: number | null;
  _count?: { assets: number; sessions: number };
};
type Asset = {
  id: string; type: string; titleAr: string; descAr: string | null;
  url: string | null; coverUrl: string | null;
  duration?: number; isDownloadable: boolean;
  requiredEntitlement?: string; canAccess: boolean;
  coach?: Coach | null;
  viewCount: number; saveCount: number; downloadCount: number;
  isSaved: boolean;
};
type AvailDay = { date: string; dayOfWeek: number; slots: string[] };

const TYPE_LABEL: Record<string, string> = { video: 'فيديو', pdf: 'ملف PDF', material: 'تمرين', image: 'صورة' };

const DAY_AR: Record<number, string> = { 0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء', 4: 'الخميس', 5: 'الجمعة', 6: 'السبت' };

function resolveUrl(url: string) {
  if (!url) return url;
  if (url.includes('://localhost')) return url.replace(/https?:\/\/localhost:\d+/, MEDIA_BASE);
  return url.startsWith('http') ? url : `${MEDIA_BASE}${url}`;
}
function fmtCount(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}
function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

// ─── Video Player ──────────────────────────────────────────────────────────────
function VideoPlayer({ url }: { url: string }) {
  const ref = useRef<Video>(null);
  const [error, setError] = useState(false);
  const [buffering, setBuffering] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showFsBtn, setShowFsBtn] = useState(true);
  const fsOpacity = useRef(new Animated.Value(1)).current;

  function onStatus(s: AVPlaybackStatus) {
    if (!s.isLoaded) { if ((s as any).error) setError(true); return; }
    setBuffering(s.isBuffering ?? false);
    setIsPlaying(s.isPlaying ?? false);
  }

  function toggleFsBtn() {
    const toValue = showFsBtn ? 0 : 1;
    setShowFsBtn(!showFsBtn);
    Animated.timing(fsOpacity, { toValue, duration: 200, useNativeDriver: true }).start();
  }

  async function goFullscreen() {
    try { await ref.current?.presentFullscreenPlayer(); } catch { /* unsupported */ }
  }

  if (error) return (
    <View style={vp.wrap}>
      <LinearGradient colors={['#0a0a0a', '#111']} style={StyleSheet.absoluteFill} />
      <Play size={32} color="rgba(255,255,255,0.25)" />
      <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: font.medium, fontSize: 12, marginTop: 8, textAlign: 'center' }}>
        تعذّر تشغيل الفيديو
      </Text>
    </View>
  );

  return (
    <Pressable style={vp.wrap} onPress={toggleFsBtn}>
      <Video ref={ref} source={{ uri: resolveUrl(url) }} style={vp.video}
        resizeMode={ResizeMode.CONTAIN} useNativeControls shouldPlay={false}
        isLooping={false} onPlaybackStatusUpdate={onStatus} onError={() => setError(true)} />
      {buffering && (
        <View style={vp.overlay} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      )}
      {/* Fullscreen button */}
      <Animated.View style={[vp.fsBtn, { opacity: fsOpacity }]} pointerEvents="box-none">
        <Pressable onPress={goFullscreen} hitSlop={12} style={vp.fsBtnInner}>
          <Maximize2 size={16} color="#fff" />
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}
const vp = StyleSheet.create({
  wrap: { width: '100%', height: 240, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  video: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject as any, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  fsBtn: { position: 'absolute', bottom: 12, right: 12 },
  fsBtnInner: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
});

// ─── Booking Bottom Sheet ──────────────────────────────────────────────────────
function BookingSheet({
  coach, visible, onClose,
}: {
  coach: Coach; visible: boolean; onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(600)).current;

  const [avail, setAvail] = useState<AvailDay[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState<'pick' | 'confirm' | 'success'>('pick');
  const [booking, setBooking] = useState(false);
  const [bookedSession, setBookedSession] = useState<{ meetingUrl: string } | null>(null);

  useEffect(() => {
    if (!visible) return;
    setStep('pick'); setSelectedDate(null); setSelectedSlot(null); setNotes('');
    Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    setLoadingAvail(true);
    api<AvailDay[]>(`/coaches/${coach.id}/availability`)
      .then((d) => { setAvail(d); if (d.length > 0) setSelectedDate(d[0].date); })
      .catch(() => setAvail([]))
      .finally(() => setLoadingAvail(false));
  }, [visible]);

  function close() {
    Animated.timing(slideY, { toValue: 600, duration: 250, useNativeDriver: true }).start(onClose);
  }

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return;
    setBooking(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString();
      const res = await api<{ meetingUrl: string }>('/consult/book', {
        method: 'POST',
        body: { coachId: coach.id, scheduledAt, durationMin: 60, notesAr: notes || undefined },
      });
      setBookedSession(res);
      setStep('success');
    } catch (e) {
      Alert.alert('فشل الحجز', (e as Error).message.includes('{') ? 'حدث خطأ، حاول مرة أخرى.' : (e as Error).message);
    } finally {
      setBooking(false);
    }
  }

  const activeDay = avail.find((d) => d.date === selectedDate);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close}>
      <Pressable style={BS.backdrop} onPress={close}>
        <Animated.View style={[BS.sheet, { transform: [{ translateY: slideY }], paddingBottom: insets.bottom + 16 }]}>
          <Pressable>
            {/* Handle */}
            <View style={BS.handle} />

            {/* Header */}
            <View style={BS.header}>
              <Pressable onPress={close} hitSlop={12} style={BS.closeBtn}>
                <X size={18} color={colors.textMid} />
              </Pressable>
              <Text style={BS.headerTitle}>
                {step === 'success' ? 'تم الحجز ✓' : 'احجز جلسة استشارية'}
              </Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Coach mini card */}
            <View style={BS.coachMini}>
              {coach.avatarUrl ? (
                <Image source={{ uri: resolveUrl(coach.avatarUrl) }} style={BS.coachAvatar} />
              ) : (
                <View style={[BS.coachAvatar, BS.coachAvatarPlaceholder]}>
                  <User size={20} color={colors.brand} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={BS.coachName}>{coach.nameAr}</Text>
                {coach.specialtyAr && <Text style={BS.coachSpec}>{coach.specialtyAr}</Text>}
              </View>
              {coach.priceSAR ? (
                <View style={BS.pricePill}>
                  <Text style={BS.priceText}>{coach.priceSAR} ر.س</Text>
                  <Text style={BS.priceUnit}>/جلسة</Text>
                </View>
              ) : null}
            </View>

            {/* ── STEP: PICK ── */}
            {step === 'pick' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
                {loadingAvail ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                    <ActivityIndicator color={colors.brand} />
                    <Text style={{ fontFamily: font.regular, color: colors.textLo, fontSize: 13, marginTop: 10 }}>جارٍ تحميل المواعيد…</Text>
                  </View>
                ) : avail.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 }}>
                    <Calendar size={36} color={colors.textLo} />
                    <Text style={{ fontFamily: font.medium, color: colors.textMid, fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                      لا توجد مواعيد متاحة حالياً{'\n'}تحقق لاحقاً
                    </Text>
                  </View>
                ) : (
                  <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.md }}>
                    {/* Date strip */}
                    <Text style={BS.sectionLabel}>اختر التاريخ</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
                      {avail.map((d) => {
                        const active = selectedDate === d.date;
                        return (
                          <Pressable key={d.date} onPress={() => { setSelectedDate(d.date); setSelectedSlot(null); }} style={[BS.dateChip, active && BS.dateChipActive]}>
                            <Text style={[BS.dateDow, active && { color: '#fff' }]}>{DAY_AR[d.dayOfWeek]}</Text>
                            <Text style={[BS.dateDay, active && { color: '#fff' }]}>{fmtDate(d.date)}</Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    {/* Time slots */}
                    {activeDay && (
                      <>
                        <Text style={BS.sectionLabel}>اختر الوقت</Text>
                        <View style={BS.slotsGrid}>
                          {activeDay.slots.map((slot) => {
                            const active = selectedSlot === slot;
                            return (
                              <Pressable key={slot} onPress={() => setSelectedSlot(slot)} style={[BS.slotChip, active && BS.slotChipActive]}>
                                <Clock size={12} color={active ? '#fff' : colors.brand} />
                                <Text style={[BS.slotText, active && { color: '#fff' }]}>{slot}</Text>
                              </Pressable>
                            );
                          })}
                        </View>
                      </>
                    )}

                    {/* Notes */}
                    <Text style={BS.sectionLabel}>ملاحظات (اختياري)</Text>
                    <TextInput
                      style={BS.notesInput}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="ما الذي تود مناقشته في الجلسة؟"
                      placeholderTextColor={colors.textLo}
                      multiline
                      numberOfLines={3}
                      textAlign="right"
                      maxLength={300}
                    />

                    {/* Summary row */}
                    {selectedDate && selectedSlot && (
                      <View style={BS.summaryRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={BS.summaryLabel}>موعد الجلسة</Text>
                          <Text style={BS.summaryVal}>{DAY_AR[activeDay!.dayOfWeek]} {fmtDate(selectedDate)} — {selectedSlot}</Text>
                        </View>
                        {coach.priceSAR ? (
                          <Text style={BS.summaryPrice}>{coach.priceSAR} ر.س</Text>
                        ) : null}
                      </View>
                    )}

                    <Pressable
                      onPress={() => { if (!selectedDate || !selectedSlot) return; setStep('confirm'); }}
                      style={[BS.ctaBtn, (!selectedDate || !selectedSlot) && BS.ctaBtnDisabled]}
                      disabled={!selectedDate || !selectedSlot}
                    >
                      <LinearGradient colors={[colors.brand, colors.brand2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                      <Text style={BS.ctaBtnText}>التالي — تأكيد الحجز</Text>
                      <ChevronLeft size={16} color="#fff" />
                    </Pressable>

                    <View style={{ height: 8 }} />
                  </View>
                )}
              </ScrollView>
            )}

            {/* ── STEP: CONFIRM ── */}
            {step === 'confirm' && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
                <View style={{ padding: spacing.lg, gap: spacing.md }}>
                  <Text style={BS.sectionLabel}>تفاصيل الجلسة</Text>

                  <View style={BS.confirmCard}>
                    <Row icon={<Calendar size={16} color={colors.brand} />} label="التاريخ" value={`${DAY_AR[activeDay!.dayOfWeek]}، ${fmtDate(selectedDate!)}`} />
                    <View style={BS.confirmDivider} />
                    <Row icon={<Clock size={16} color={colors.brand} />} label="الوقت" value={selectedSlot!} />
                    <View style={BS.confirmDivider} />
                    <Row icon={<VideoIcon size={16} color={colors.brand} />} label="النوع" value="جلسة فيديو — 60 دقيقة" />
                    {coach.priceSAR ? (
                      <>
                        <View style={BS.confirmDivider} />
                        <Row icon={<Star size={16} color={colors.gold} />} label="السعر" value={`${coach.priceSAR} ر.س`} valueStyle={{ color: colors.gold, fontFamily: font.bold }} />
                      </>
                    ) : null}
                    {notes ? (
                      <>
                        <View style={BS.confirmDivider} />
                        <Row icon={<User size={16} color={colors.textLo} />} label="ملاحظاتك" value={notes} />
                      </>
                    ) : null}
                  </View>

                  <View style={BS.infoBox}>
                    <Text style={BS.infoText}>🔗 سيتم إنشاء رابط الاجتماع تلقائياً وإرساله لك عبر الإشعارات والبريد الإلكتروني بعد تأكيد الحجز.</Text>
                  </View>

                  <Pressable onPress={handleBook} disabled={booking} style={[BS.ctaBtn, booking && BS.ctaBtnDisabled]}>
                    <LinearGradient colors={[colors.brand, colors.brand2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                    {booking ? <ActivityIndicator color="#fff" size="small" /> : null}
                    <Text style={BS.ctaBtnText}>{booking ? 'جارٍ الحجز…' : 'تأكيد الحجز'}</Text>
                  </Pressable>

                  <Pressable onPress={() => setStep('pick')} style={BS.backLink}>
                    <ChevronRight size={15} color={colors.textLo} />
                    <Text style={BS.backLinkText}>تعديل الموعد</Text>
                  </Pressable>
                </View>
              </ScrollView>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <View style={{ padding: spacing.lg, gap: spacing.md, alignItems: 'center' }}>
                <View style={BS.successCircle}>
                  <CheckCircle size={44} color={colors.success} />
                </View>
                <Text style={BS.successTitle}>تم تأكيد الحجز!</Text>
                <Text style={BS.successSub}>
                  جلستك مع {coach.nameAr} محجوزة بتاريخ{'\n'}
                  {DAY_AR[avail.find((d) => d.date === selectedDate)?.dayOfWeek ?? 0]} {fmtDate(selectedDate!)} — {selectedSlot}
                </Text>
                {bookedSession?.meetingUrl && (
                  <View style={BS.meetingUrlBox}>
                    <VideoIcon size={14} color={colors.brand} />
                    <Text style={BS.meetingUrlText} numberOfLines={2}>{bookedSession.meetingUrl}</Text>
                  </View>
                )}
                <Text style={{ fontFamily: font.regular, fontSize: 12.5, color: colors.textLo, textAlign: 'center', lineHeight: 20 }}>
                  تم إرسال تفاصيل الجلسة ورابط الاجتماع إلى بريدك الإلكتروني وإشعاراتك.
                </Text>
                <Pressable onPress={close} style={[BS.ctaBtn, { overflow: 'hidden' }]}>
                  <LinearGradient colors={[colors.success, '#059669']} style={StyleSheet.absoluteFill} />
                  <Text style={BS.ctaBtnText}>رائع، شكراً!</Text>
                </Pressable>
              </View>
            )}
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function Row({ icon, label, value, valueStyle }: { icon: React.ReactNode; label: string; value: string; valueStyle?: any }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 10 }}>
      <View style={{ marginTop: 1 }}>{icon}</View>
      <Text style={{ fontFamily: font.regular, fontSize: 13, color: colors.textLo, width: 70 }}>{label}</Text>
      <Text style={[{ fontFamily: font.medium, fontSize: 13.5, color: colors.textHi, flex: 1, textAlign: 'right' }, valueStyle]}>{value}</Text>
    </View>
  );
}

const BS = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 20, elevation: 20,
  },
  handle: { width: 40, height: 4, backgroundColor: colors.glassBorder, borderRadius: 4, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  closeBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },

  coachMini: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  coachAvatar: { width: 46, height: 46, borderRadius: 23, borderWidth: 2, borderColor: colors.brand },
  coachAvatarPlaceholder: { backgroundColor: 'rgba(46,197,182,0.1)', alignItems: 'center', justifyContent: 'center' },
  coachName: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  coachSpec: { fontFamily: font.regular, fontSize: 12, color: colors.textLo, textAlign: 'right', marginTop: 2 },
  pricePill: { backgroundColor: 'rgba(46,197,182,0.1)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center' },
  priceText: { fontFamily: font.bold, fontSize: 15, color: colors.brand },
  priceUnit: { fontFamily: font.regular, fontSize: 10, color: colors.textLo },

  sectionLabel: { fontFamily: font.bold, fontSize: 13, color: colors.textMid, textAlign: 'right' },

  dateChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.glassBorder,
    backgroundColor: colors.glassFill, alignItems: 'center', minWidth: 72,
  },
  dateChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  dateDow: { fontFamily: font.medium, fontSize: 11, color: colors.textLo },
  dateDay: { fontFamily: font.bold, fontSize: 13, color: colors.textHi, marginTop: 2 },

  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  slotChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill,
    borderWidth: 1.5, borderColor: colors.brand,
    backgroundColor: 'rgba(46,197,182,0.06)',
  },
  slotChipActive: { backgroundColor: colors.brand },
  slotText: { fontFamily: font.bold, fontSize: 13, color: colors.brand },

  notesInput: {
    backgroundColor: colors.bg1, borderWidth: 1, borderColor: colors.glassBorder,
    borderRadius: radii.md, padding: 12, fontFamily: font.regular,
    fontSize: 14, color: colors.textHi, minHeight: 80, textAlignVertical: 'top',
  },

  summaryRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(46,197,182,0.07)', borderRadius: radii.md,
    padding: 14, borderWidth: 1, borderColor: 'rgba(46,197,182,0.2)',
  },
  summaryLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right' },
  summaryVal: { fontFamily: font.bold, fontSize: 13.5, color: colors.textHi, textAlign: 'right', marginTop: 2 },
  summaryPrice: { fontFamily: font.bold, fontSize: 20, color: colors.brand },

  ctaBtn: {
    height: 52, borderRadius: radii.md, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
  },
  ctaBtnDisabled: { opacity: 0.45 },
  ctaBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },

  backLink: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', paddingVertical: 4 },
  backLinkText: { fontFamily: font.medium, fontSize: 13, color: colors.textLo },

  confirmCard: {
    backgroundColor: colors.bg1, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.glassBorder, paddingHorizontal: 16,
  },
  confirmDivider: { height: 1, backgroundColor: colors.glassBorder },

  infoBox: {
    backgroundColor: 'rgba(46,197,182,0.06)', borderRadius: radii.md,
    borderWidth: 1, borderColor: 'rgba(46,197,182,0.18)', padding: 12,
  },
  infoText: { fontFamily: font.regular, fontSize: 12.5, color: colors.textMid, textAlign: 'right', lineHeight: 20 },

  successCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  successTitle: { fontFamily: font.bold, fontSize: 22, color: colors.textHi },
  successSub: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'center', lineHeight: 22 },
  meetingUrlBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(46,197,182,0.07)', borderRadius: radii.md,
    padding: 12, borderWidth: 1, borderColor: 'rgba(46,197,182,0.2)', width: '100%',
  },
  meetingUrlText: { fontFamily: font.medium, fontSize: 12, color: colors.brand, flex: 1 },

  gold: { color: '#F59E0B' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function LibraryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewCount, setViewCount] = useState(0);
  const [saveCount, setSaveCount] = useState(0);
  const [downloadCount, setDownloadCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dlState, setDlState] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [dlPct, setDlPct] = useState(0);
  const [showBooking, setShowBooking] = useState(false);

  useEffect(() => {
    if (!id) return;
    api<Asset>(`/library/${id}`)
      .then((a) => {
        setAsset(a);
        setViewCount(a.viewCount ?? 0);
        setSaveCount(a.saveCount ?? 0);
        setDownloadCount(a.downloadCount ?? 0);
        setIsSaved(a.isSaved ?? false);
        api(`/library/${id}/view`, { method: 'POST' }).catch(() => null);
        setViewCount((c) => c + 1);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave() {
    if (!id || saveLoading) return;
    if (!authStore.isLoggedIn()) { router.push('/login' as never); return; }
    setSaveLoading(true);
    try {
      const res = await api<{ isSaved: boolean; saveCount: number }>(`/library/${id}/save`, { method: 'POST' });
      setIsSaved(res.isSaved);
      setSaveCount(res.saveCount);
    } catch { Alert.alert('خطأ', 'تعذّر حفظ المحتوى'); } finally { setSaveLoading(false); }
  }

  async function handleDownload() {
    if (!asset?.url || dlState === 'downloading') return;
    setDlState('downloading'); setDlPct(0);
    try {
      const ext = asset.type === 'pdf' ? '.pdf' : '.mp4';
      const dest = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? '') + `${asset.titleAr.replace(/[^a-zA-Z0-9؀-ۿ]/g, '_')}${ext}`;
      const dl = FileSystem.createDownloadResumable(resolveUrl(asset.url), dest, {},
        (s) => setDlPct(Math.round((s.totalBytesWritten / (s.totalBytesExpectedToWrite || 1)) * 100)));
      const result = await dl.downloadAsync();
      if (!result?.uri) throw new Error();
      setDlState('done');
      api<{ downloadCount: number }>(`/library/${id}/download`, { method: 'POST' })
        .then((r) => setDownloadCount(r.downloadCount)).catch(() => setDownloadCount((c) => c + 1));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
      else Alert.alert('تم التحميل', result.uri);
    } catch { setDlState('error'); Alert.alert('فشل التحميل', 'حاول مرة أخرى'); }
  }

  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={colors.brand} size="large" /></View>;
  if (!asset) return <View style={S.fullCenter}><Text style={{ color: colors.textLo, fontFamily: font.regular }}>لم يُعثر على المحتوى</Text></View>;

  const isLocked = !asset.canAccess;
  const isVideo = asset.type === 'video';
  const isPdf = asset.type === 'pdf';
  const coach = asset.coach;

  return (
    <View style={S.root}>
      {/* ── MEDIA HERO ── */}
      {isLocked ? (
        <View style={S.hero}>
          <LinearGradient colors={['#0B1222', '#1a2540']} style={StyleSheet.absoluteFill} />
          <Crown size={44} color={colors.gold} />
          <Text style={S.lockedTitle}>محتوى حصري</Text>
          <Text style={S.lockedSub}>للمشتركين فقط</Text>
        </View>
      ) : isVideo && asset.url ? (
        <VideoPlayer url={asset.url} />
      ) : isPdf && asset.url ? (
        <View style={S.hero}>
          {asset.coverUrl
            ? <Image source={{ uri: resolveUrl(asset.coverUrl) }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
            : <LinearGradient colors={['#0d2137', '#0a3d4f']} style={StyleSheet.absoluteFill} />}
          <LinearGradient colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.65)']} style={StyleSheet.absoluteFill} />
          <View style={S.pdfBadge}><FileText size={13} color="#fff" /><Text style={S.pdfBadgeText}>PDF</Text></View>
          <View style={S.pdfBottom}>
            <Text style={S.pdfTitle} numberOfLines={2}>{asset.titleAr}</Text>
            <Pressable onPress={() => router.push({ pathname: '/library/pdf', params: { url: asset.url!, title: asset.titleAr } })} style={S.readBtn}>
              <BookOpen size={14} color="#06121f" /><Text style={S.readBtnText}>اقرأ الآن</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={S.hero}><LinearGradient colors={['#0B1222', '#112035']} style={StyleSheet.absoluteFill} /></View>
      )}

      {/* Floating nav */}
      <SafeAreaView edges={['top']} style={S.floatNav} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} style={S.backBtn}>
          <ChevronRight size={20} color="#fff" />
        </Pressable>
        <View style={S.typePill}><Text style={S.typeText}>{TYPE_LABEL[asset.type] ?? asset.type}</Text></View>
      </SafeAreaView>

      {/* ── CONTENT ── */}
      <ScrollView style={S.sheet} contentContainerStyle={S.sheetContent} showsVerticalScrollIndicator={false}>

        {/* Locked banner */}
        {isLocked && (
          <View style={S.lockedBanner}>
            <Lock size={15} color={colors.gold} />
            <Text style={S.lockedBannerText}>اشترك للوصول لهذا المحتوى</Text>
            <Pressable onPress={() => router.push('/subscription')} style={S.subBtn}>
              <Text style={S.subBtnText}>اشترك</Text>
            </Pressable>
          </View>
        )}

        {/* Title */}
        <Text style={S.title}>{asset.titleAr}</Text>

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={S.stat}><Eye size={13} color={colors.textLo} /><Text style={S.statN}>{fmtCount(viewCount)}</Text><Text style={S.statL}>مشاهدة</Text></View>
          <View style={S.statDiv} />
          <View style={S.stat}><Bookmark size={13} color={colors.textLo} /><Text style={S.statN}>{fmtCount(saveCount)}</Text><Text style={S.statL}>حفظ</Text></View>
          <View style={S.statDiv} />
          <View style={S.stat}><Download size={13} color={colors.textLo} /><Text style={S.statN}>{fmtCount(downloadCount)}</Text><Text style={S.statL}>تحميل</Text></View>
        </View>

        {/* Description */}
        {asset.descAr ? <Text style={S.desc}>{asset.descAr}</Text> : null}

        {/* Action buttons */}
        {!isLocked && (
          <View style={S.actionRow}>
            <Pressable onPress={handleSave} disabled={saveLoading} style={[S.actionBtn, isSaved && S.actionBtnActive]}>
              {saveLoading ? <ActivityIndicator size="small" color={isSaved ? '#fff' : colors.brand} />
                : isSaved ? <BookmarkCheck size={17} color="#fff" /> : <Bookmark size={17} color={colors.brand} />}
              <Text style={[S.actionBtnText, isSaved && { color: '#fff' }]}>{isSaved ? 'محفوظ' : 'حفظ'}</Text>
            </Pressable>
            {asset.isDownloadable && asset.url && (
              <Pressable onPress={handleDownload} disabled={dlState === 'downloading'} style={[S.actionBtn, S.actionBtnDownload, dlState === 'done' && S.actionBtnDone]}>
                {dlState === 'downloading'
                  ? <><ActivityIndicator size="small" color={colors.brand} /><Text style={S.actionBtnText}>{dlPct}٪</Text></>
                  : <><Download size={17} color={dlState === 'done' ? colors.success : colors.brand} />
                    <Text style={[S.actionBtnText, dlState === 'done' && { color: colors.success }]}>
                      {dlState === 'done' ? 'تم التحميل ✓' : 'تحميل'}
                    </Text></>}
              </Pressable>
            )}
          </View>
        )}
        {dlState === 'downloading' && (
          <View style={S.progressTrack}><View style={[S.progressFill, { width: `${dlPct}%` as any }]} /></View>
        )}

        <View style={S.divider} />

        {/* ── COACH SECTION ── */}
        {coach && (
          <View style={S.coachSection}>
            <Text style={S.coachSectionLabel}>نُشر بواسطة</Text>

            {/* Coach profile card */}
            <View style={S.coachCard}>
              <View style={S.coachTop}>
                {coach.avatarUrl ? (
                  <Image source={{ uri: resolveUrl(coach.avatarUrl) }} style={S.coachImg} />
                ) : (
                  <View style={[S.coachImg, S.coachImgPlaceholder]}>
                    <User size={24} color={colors.brand} />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={S.coachName}>{coach.nameAr}</Text>
                  {coach.specialtyAr && <Text style={S.coachSpec}>{coach.specialtyAr}</Text>}
                  {coach._count && (
                    <View style={S.coachStats}>
                      <View style={S.coachStat}>
                        <Text style={S.coachStatN}>{coach._count.assets}</Text>
                        <Text style={S.coachStatL}>محتوى</Text>
                      </View>
                      <View style={S.coachStatDiv} />
                      <View style={S.coachStat}>
                        <Text style={S.coachStatN}>{coach._count.sessions}</Text>
                        <Text style={S.coachStatL}>جلسة</Text>
                      </View>
                    </View>
                  )}
                </View>
                {coach.priceSAR ? (
                  <View style={S.priceBadge}>
                    <Text style={S.priceNum}>{coach.priceSAR}</Text>
                    <Text style={S.priceLbl}>ر.س/جلسة</Text>
                  </View>
                ) : null}
              </View>

              {/* Bio */}
              {coach.bioAr ? (
                <Text style={S.coachBio}>{coach.bioAr}</Text>
              ) : null}

              {/* Book button */}
              <Pressable
                onPress={() => {
                  if (!authStore.isLoggedIn()) { router.push('/login' as never); return; }
                  setShowBooking(true);
                }}
                style={S.bookBtn}
              >
                <LinearGradient colors={[colors.brand, colors.brand2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} />
                <Calendar size={17} color="#fff" />
                <Text style={S.bookBtnText}>احجز جلسة استشارية</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Booking sheet */}
      {coach && (
        <BookingSheet
          coach={coach}
          visible={showBooking}
          onClose={() => setShowBooking(false)}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg0 },
  fullCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg0 },

  hero: { width: '100%', height: 240, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { fontFamily: font.bold, fontSize: 18, color: colors.gold, marginTop: 10 },
  lockedSub: { fontFamily: font.regular, fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 4 },
  pdfBadge: { position: 'absolute', top: 60, right: 14, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pdfBadgeText: { fontFamily: font.medium, fontSize: 11, color: '#fff' },
  pdfBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.md, gap: 10 },
  pdfTitle: { fontFamily: font.bold, fontSize: 18, color: '#fff', textAlign: 'right' },
  readBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#fff', alignSelf: 'flex-end', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  readBtnText: { fontFamily: font.bold, fontSize: 13, color: '#06121f' },

  floatNav: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm, zIndex: 10 },
  backBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  typePill: { backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  typeText: { fontFamily: font.medium, fontSize: 12, color: '#fff' },

  sheet: { flex: 1 },
  sheetContent: { padding: spacing.lg, gap: spacing.md },

  lockedBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(245,158,11,0.07)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)', borderRadius: radii.md, padding: spacing.md, flexWrap: 'wrap' },
  lockedBannerText: { fontFamily: font.medium, fontSize: 13, color: colors.gold, flex: 1, textAlign: 'right' },
  subBtn: { backgroundColor: colors.gold, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  subBtnText: { fontFamily: font.bold, fontSize: 13, color: '#1a0f00' },

  title: { fontFamily: font.bold, fontSize: 20, color: colors.textHi, textAlign: 'right', lineHeight: 30 },

  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.md, paddingVertical: 11, paddingHorizontal: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10 },
  statN: { fontFamily: font.bold, fontSize: 13, color: colors.textHi },
  statL: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  statDiv: { width: 1, height: 18, backgroundColor: colors.glassBorder },

  desc: { fontFamily: font.regular, fontSize: 14, color: colors.textMid, textAlign: 'right', lineHeight: 22 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1.5, borderColor: colors.brand, borderRadius: radii.md, paddingVertical: 13, backgroundColor: 'rgba(46,197,182,0.06)' },
  actionBtnActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  actionBtnDownload: { flex: 1.3 },
  actionBtnDone: { borderColor: colors.success, backgroundColor: 'rgba(16,185,129,0.06)' },
  actionBtnText: { fontFamily: font.bold, fontSize: 13.5, color: colors.brand },
  progressTrack: { height: 3, backgroundColor: 'rgba(46,197,182,0.15)', borderRadius: 3, overflow: 'hidden', marginTop: -8 },
  progressFill: { height: 3, backgroundColor: colors.brand, borderRadius: 3 },
  divider: { height: 1, backgroundColor: colors.glassBorder },

  // Coach section
  coachSection: { gap: 10 },
  coachSectionLabel: { fontFamily: font.bold, fontSize: 12, color: colors.textLo, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 0.5 },
  coachCard: { borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.lg, overflow: 'hidden', backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  coachTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: spacing.md },
  coachImg: { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: colors.brand },
  coachImgPlaceholder: { backgroundColor: 'rgba(46,197,182,0.1)', alignItems: 'center', justifyContent: 'center' },
  coachName: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right' },
  coachSpec: { fontFamily: font.regular, fontSize: 12.5, color: colors.brand, textAlign: 'right', marginTop: 3 },
  coachStats: { flexDirection: 'row', gap: 0, marginTop: 8, alignSelf: 'flex-end' },
  coachStat: { alignItems: 'center', paddingHorizontal: 10 },
  coachStatN: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  coachStatL: { fontFamily: font.regular, fontSize: 10, color: colors.textLo, marginTop: 1 },
  coachStatDiv: { width: 1, height: 28, backgroundColor: colors.glassBorder, alignSelf: 'center' },
  priceBadge: { alignItems: 'center', backgroundColor: 'rgba(46,197,182,0.08)', borderRadius: radii.md, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(46,197,182,0.2)' },
  priceNum: { fontFamily: font.bold, fontSize: 17, color: colors.brand },
  priceLbl: { fontFamily: font.regular, fontSize: 10, color: colors.textLo, marginTop: 1 },
  coachBio: { fontFamily: font.regular, fontSize: 13.5, color: colors.textMid, textAlign: 'right', lineHeight: 22, paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
  bookBtn: { margin: spacing.md, marginTop: 4, height: 50, borderRadius: radii.md, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bookBtnText: { fontFamily: font.bold, fontSize: 15, color: '#fff' },
});
