import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { GradientBackground } from '../../src/components/GradientBackground';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing, type } from '../../src/theme';
import { Bot, Send, PartyPopper, Brain, Clock, Zap, Check, Sparkles } from 'lucide-react-native';

type Tab = 'chat' | 'plan' | 'tasks';
type Message = { id: string; me: boolean; text: string };
type Task = { id: string; titleAr: string; status: string };

const INITIAL_MSG: Message = {
  id: '0',
  me: false,
  text: 'مرحباً! أنا مرشدك الذكي في قادر 🌿\nكيف يمكنني مساعدتك اليوم؟ يمكنك سؤالي عن الأهداف، إدارة الوقت، بناء الثقة، أو أي شيء تريد تطويره.',
};

export default function Mentor() {
  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    api<Task[]>('/mentor/tasks').then(setTasks).catch(() => []);
  }, []);

  async function send() {
    const txt = input.trim();
    if (!txt || sending) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), me: true, text: txt };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await api<{ response: string }>('/mentor/chat', {
        method: 'POST',
        body: { message: txt },
      });
      const aiMsg: Message = { id: (Date.now() + 1).toString(), me: false, text: res.response };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const err: Message = { id: (Date.now() + 1).toString(), me: false, text: 'عذراً، تعذّر الاتصال بالمرشد الآن. حاول مرة أخرى.' };
      setMessages((prev) => [...prev, err]);
    } finally {
      setSending(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  async function toggleTask(task: Task) {
    const newStatus = task.status === 'done' ? 'pending' : 'done';
    try {
      await api(`/mentor/tasks/${task.id}`, { method: 'PATCH', body: { status: newStatus } });
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: newStatus } : t));
    } catch {}
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'chat', label: 'المحادثة' },
    { key: 'tasks', label: 'مهام اليوم' },
    { key: 'plan', label: 'خطتي' },
  ];

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.root}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.aiDot}><Sparkles size={24} color={colors.brand} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[type.h2, { textAlign: 'right' }]}>المرشد الذكي</Text>
              <Text style={styles.subtitle}>يعمل بالذكاء الاصطناعي • متاح دائماً</Text>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabs}>
            {TABS.map((t) => (
              <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.tabItem, tab === t.key && styles.tabActive]}>
                <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* CHAT */}
          {tab === 'chat' && (
            <>
              <FlatList
                ref={flatRef}
                data={messages}
                keyExtractor={(m) => m.id}
                contentContainerStyle={styles.chatList}
                onContentSizeChange={() => flatRef.current?.scrollToEnd()}
                renderItem={({ item: m }) => (
                  <View style={[styles.row, m.me ? styles.rowMe : styles.rowAi]}>
                    {!m.me && (
                      <View style={styles.avatar}><Bot size={18} color={colors.brand} /></View>
                    )}
                    <GlassCard
                      style={[styles.bubble, m.me && styles.bubbleMe]}
                      intensity={m.me ? 20 : 45}
                    >
                      <Text style={[styles.msgText, m.me && styles.msgTextMe]}>{m.text}</Text>
                    </GlassCard>
                  </View>
                )}
              />
              <View style={styles.inputRow}>
                <Pressable onPress={send} style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}>
                  <Send size={18} color="#06121f" style={{ marginLeft: -2 }} />
                </Pressable>
                <TextInput
                  style={styles.input}
                  placeholder="اكتب رسالتك…"
                  placeholderTextColor={colors.textLo}
                  value={input}
                  onChangeText={setInput}
                  multiline
                  textAlign="right"
                  onSubmitEditing={send}
                  returnKeyType="send"
                />
              </View>
            </>
          )}

          {/* TASKS */}
          {tab === 'tasks' && (
            <ScrollView contentContainerStyle={styles.section} showsVerticalScrollIndicator={false}>
              {tasks.length === 0 ? (
                <View style={styles.empty}>
                  <PartyPopper size={48} color={colors.brand} />
                  <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>لا توجد مهام اليوم</Text>
                </View>
              ) : tasks.map((t) => (
                <Pressable key={t.id} onPress={() => toggleTask(t)}>
                  <GlassCard style={styles.taskRow}>
                    <View style={[styles.check, t.status === 'done' && styles.checkDone]}>
                      {t.status === 'done' && <Check size={16} color="#06121f" />}
                    </View>
                    <Text style={[styles.taskText, t.status === 'done' && styles.taskDone]}>
                      {t.titleAr}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* PLAN */}
          {tab === 'plan' && (
            <ScrollView contentContainerStyle={styles.section}>
              <GlassCard style={styles.planCard}>
                <Text style={[type.h2, { textAlign: 'right', marginBottom: spacing.sm }]}>خطتي التطويرية</Text>
                <Text style={[type.body, { textAlign: 'right', color: colors.textLo }]}>
                  بناءً على تقييمك الأولي، سنعمل على تطوير مهاراتك في ثلاثة محاور رئيسية:
                </Text>
                {[
                  { icon: Brain, title: 'الذكاء العاطفي', desc: 'فهم وإدارة مشاعرك وبناء علاقات صحية', color: '#F59E0B' },
                  { icon: Clock, title: 'إدارة الوقت', desc: 'تحديد الأولويات وزيادة الإنتاجية اليومية', color: colors.brand2 },
                  { icon: Zap, title: 'بناء الثقة', desc: 'تطوير الثقة بالنفس وتحسين التعبير عن الذات', color: colors.brand },
                ].map((pillar) => (
                  <View key={pillar.title} style={styles.pillar}>
                    <pillar.icon size={28} color={pillar.color} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pillarTitle}>{pillar.title}</Text>
                      <Text style={styles.pillarDesc}>{pillar.desc}</Text>
                    </View>
                  </View>
                ))}
              </GlassCard>

              <GlassCard style={styles.progressCard}>
                <Text style={styles.progressTitle}>التقدم الأسبوعي</Text>
                {[
                  { label: 'الذكاء العاطفي', pct: 45 },
                  { label: 'إدارة الوقت', pct: 70 },
                  { label: 'بناء الثقة', pct: 30 },
                ].map((bar) => (
                  <View key={bar.label} style={{ gap: 6, marginTop: spacing.sm }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={styles.barPct}>{bar.pct}٪</Text>
                      <Text style={styles.barLabel}>{bar.label}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${bar.pct}%` }]} />
                    </View>
                  </View>
                ))}
              </GlassCard>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  aiDot: { width: 44, height: 44, borderRadius: 44, backgroundColor: 'rgba(46,197,182,0.2)', borderWidth: 2, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  subtitle: { fontFamily: font.regular, color: colors.brand, fontSize: 12, textAlign: 'right' },
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  tabItem: { flex: 1, paddingVertical: 10, borderRadius: radii.pill, alignItems: 'center', backgroundColor: colors.glassFill, borderWidth: 1, borderColor: colors.glassBorder },
  tabActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  tabText: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
  tabTextActive: { color: '#06121f' },
  chatList: { padding: spacing.lg, gap: spacing.md, paddingBottom: 120 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-start', flexDirection: 'row-reverse' },
  rowAi: { justifyContent: 'flex-end' },
  avatar: { width: 32, height: 32, borderRadius: 32, backgroundColor: 'rgba(46,197,182,0.15)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '82%' },
  bubbleMe: { backgroundColor: 'rgba(46,197,182,0.25)', borderColor: colors.brand },
  msgText: { fontFamily: font.regular, fontSize: 15, color: colors.textHi, textAlign: 'right', lineHeight: 24 },
  msgTextMe: { color: colors.textHi },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.bg0, borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  input: {
    flex: 1, minHeight: 44, maxHeight: 120, borderRadius: radii.md, borderWidth: 1,
    borderColor: colors.glassBorder, paddingHorizontal: spacing.md, paddingVertical: 10,
    color: colors.textHi, fontFamily: font.regular, fontSize: 15,
    backgroundColor: colors.glassFill, textAlign: 'right',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 44, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendIcon: { color: '#06121f', fontFamily: font.bold, fontSize: 20 },
  section: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
  empty: { alignItems: 'center', padding: spacing.xl },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  check: {
    width: 24, height: 24, borderRadius: 24, borderWidth: 2, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkDone: { backgroundColor: colors.brand },
  checkMark: { color: '#06121f', fontFamily: font.bold, fontSize: 14 },
  taskText: { fontFamily: font.medium, fontSize: 15, color: colors.textHi, textAlign: 'right', flex: 1 },
  taskDone: { color: colors.textLo, textDecorationLine: 'line-through' },
  planCard: { gap: spacing.md, marginBottom: spacing.md },
  pillar: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  pillarTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi, textAlign: 'right' },
  pillarDesc: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', marginTop: 2 },
  progressCard: { gap: 4 },
  progressTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi, textAlign: 'right', marginBottom: spacing.sm },
  barTrack: { height: 6, borderRadius: 6, backgroundColor: colors.glassFill, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 6, backgroundColor: colors.brand },
  barLabel: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
  barPct: { fontFamily: font.bold, fontSize: 13, color: colors.brand },
});
