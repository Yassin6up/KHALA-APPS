import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, CalendarDays, Clock, FileText, Video } from 'lucide-react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

type Coach = { id: string; nameAr: string; specialtyAr: string | null };
type Availability = { dayOfWeek: number; slots: string[] };

const FALLBACK_SLOTS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

const DURATIONS = [
  { val: 30, label: '٣٠ دقيقة' },
  { val: 45, label: '٤٥ دقيقة' },
  { val: 60, label: 'ساعة كاملة' },
];

function buildDateOptions(): { label: string; iso: string; dayOfWeek: number }[] {
  const opts: { label: string; iso: string; dayOfWeek: number }[] = [];
  const now = new Date();
  for (let d = 1; d <= 14; d++) {
    const date = new Date(now);
    date.setDate(now.getDate() + d);
    date.setHours(10, 0, 0, 0);
    opts.push({
      label: date.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' }),
      iso: date.toISOString(),
      dayOfWeek: date.getDay(),
    });
  }
  return opts;
}

export default function BookSession() {
  const { coachId } = useLocalSearchParams<{ coachId: string }>();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [selectedDate, setSelectedDate] = useState<{ iso: string; dayOfWeek: number } | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const dates = buildDateOptions();

  useEffect(() => {
    if (!coachId) return;
    api<Coach>(`/coaches/${coachId}`).then(setCoach).catch(() => null);
    api<Availability[]>(`/coaches/${coachId}/availability`).then(setAvailability).catch(() => []);
  }, [coachId]);

  const slotsForSelectedDay: string[] = selectedDate
    ? (availability.find((a) => a.dayOfWeek === selectedDate.dayOfWeek)?.slots ?? FALLBACK_SLOTS)
    : [];

  function buildScheduledAt(): string {
    if (!selectedDate || !selectedTime) return '';
    const d = new Date(selectedDate.iso);
    const [h, m] = selectedTime.split(':').map(Number);
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  }

  async function handleBook() {
    if (!selectedDate || !selectedTime) {
      Alert.alert('', 'الرجاء اختيار التاريخ والوقت');
      return;
    }
    setSaving(true);
    try {
      const session = await api<{ id: string; meetingUrl: string }>('/consult/book', {
        method: 'POST',
        body: { coachId, scheduledAt: buildScheduledAt(), durationMin: duration, notesAr: notes || undefined },
      });
      router.replace(`/consult/session/${session.id}` as never);
    } catch (e: any) {
      Alert.alert('خطأ', e?.message ?? 'فشل الحجز، حاول مرة أخرى');
    } finally {
      setSaving(false);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <View style={styles.nav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <Text style={styles.navTitle}>حجز جلسة</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Coach chip */}
          {coach && (
            <GlassCard style={styles.coachChip}>
              <Video size={18} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.coachName}>{coach.nameAr}</Text>
                {coach.specialtyAr && <Text style={styles.coachSpec}>{coach.specialtyAr}</Text>}
              </View>
            </GlassCard>
          )}

          {/* Date picker */}
          <View style={styles.sectionHead}>
            <CalendarDays size={16} color={colors.brand} />
            <Text style={styles.sectionTitle}>اختر التاريخ</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dates.map((d) => (
              <Pressable
                key={d.iso}
                onPress={() => { setSelectedDate({ iso: d.iso, dayOfWeek: d.dayOfWeek }); setSelectedTime(null); }}
                style={[styles.dateChip, selectedDate?.iso === d.iso && styles.dateChipActive]}
              >
                <Text style={[styles.dateText, selectedDate?.iso === d.iso && styles.dateTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Time slots */}
          {selectedDate && (
            <>
              <View style={styles.sectionHead}>
                <Clock size={16} color={colors.brand} />
                <Text style={styles.sectionTitle}>اختر الوقت</Text>
              </View>
              {slotsForSelectedDay.length === 0 ? (
                <GlassCard>
                  <Text style={{ fontFamily: font.regular, color: colors.textLo, textAlign: 'center' }}>لا توجد مواعيد متاحة في هذا اليوم</Text>
                </GlassCard>
              ) : (
                <View style={styles.timeGrid}>
                  {slotsForSelectedDay.map((t) => (
                    <Pressable key={t} onPress={() => setSelectedTime(t)} style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}>
                      <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Duration */}
          <View style={styles.sectionHead}>
            <Clock size={16} color={colors.brand} />
            <Text style={styles.sectionTitle}>مدة الجلسة</Text>
          </View>
          <View style={styles.durRow}>
            {DURATIONS.map((d) => (
              <Pressable key={d.val} onPress={() => setDuration(d.val)} style={[styles.durChip, duration === d.val && styles.durChipActive]}>
                <Text style={[styles.durText, duration === d.val && styles.durTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Notes */}
          <View style={styles.sectionHead}>
            <FileText size={16} color={colors.brand} />
            <Text style={styles.sectionTitle}>ملاحظات للمدرب (اختياري)</Text>
          </View>
          <GlassCard style={{ padding: 0 }}>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="اكتب هنا ما تريد مناقشته في الجلسة…"
              placeholderTextColor={colors.textLo}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
              textAlign="right"
            />
          </GlassCard>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.cta}>
          <Pressable
            style={[styles.bookBtn, (!selectedDate || !selectedTime || saving) && styles.bookBtnDisabled]}
            onPress={handleBook}
            disabled={!selectedDate || !selectedTime || saving}>
            {saving ? <ActivityIndicator color="#06121f" /> : (
              <Text style={styles.bookBtnText}>تأكيد الحجز وإرسال رابط الاجتماع</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  scroll: { paddingHorizontal: spacing.lg, gap: spacing.md, paddingTop: spacing.sm },
  coachChip: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coachName: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  coachSpec: { fontFamily: font.regular, fontSize: 12, color: colors.brand, textAlign: 'right' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end' },
  sectionTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi },
  dateRow: { gap: 8, paddingBottom: 4 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
  dateChipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  dateText: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
  dateTextActive: { color: '#06121f' },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, minWidth: 80, alignItems: 'center' },
  timeChipActive: { backgroundColor: 'rgba(46,197,182,0.2)', borderColor: colors.brand },
  timeText: { fontFamily: font.medium, fontSize: 14, color: colors.textMid },
  timeTextActive: { color: colors.brand, fontFamily: font.bold },
  durRow: { flexDirection: 'row', gap: 10 },
  durChip: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder, alignItems: 'center' },
  durChipActive: { backgroundColor: 'rgba(46,197,182,0.15)', borderColor: colors.brand },
  durText: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
  durTextActive: { color: colors.brand, fontFamily: font.bold },
  notesInput: { padding: spacing.md, fontFamily: font.regular, fontSize: 14, color: colors.textHi, minHeight: 100, textAlignVertical: 'top' },
  cta: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, paddingTop: 10 },
  bookBtn: { backgroundColor: colors.brand, borderRadius: radii.pill, height: 54, alignItems: 'center', justifyContent: 'center' },
  bookBtnDisabled: { opacity: 0.4 },
  bookBtnText: { fontFamily: font.bold, fontSize: 16, color: '#06121f' },
});
