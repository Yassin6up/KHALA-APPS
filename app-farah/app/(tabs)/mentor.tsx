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
import { Bot, Send, PartyPopper, Brain, Clock, Zap, Check, Sparkles, FileText } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

type Tab = 'chat' | 'plan' | 'tasks';
type Message = { id: string; me: boolean; text: string };
type Task = { id: string; titleAr: string; titleEn?: string; status: string };
type DevPlan = { id: string; planJson: any; createdAt: string } | null;

export default function Mentor() {
  const { t, i18n } = useTranslation();
  
  const INITIAL_MSG: Message = {
    id: '0',
    me: false,
    text: t('mentor.initialMessage'),
  };

  const [tab, setTab] = useState<Tab>('chat');
  const [messages, setMessages] = useState<Message[]>([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plan, setPlan] = useState<DevPlan>(null);
  const [planLoading, setPlanLoading] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const flatRef = useRef<FlatList>(null);

  useEffect(() => {
    api<Task[]>('/mentor/tasks').then(setTasks).catch(() => []);
  }, []);

  useEffect(() => {
    if (tab === 'plan' && !plan) {
      loadPlan();
    }
  }, [tab]);

  async function loadPlan() {
    setPlanLoading(true);
    try {
      const p = await api<DevPlan>('/mentor/plan');
      setPlan(p);
    } catch {
      setPlan(null);
    } finally {
      setPlanLoading(false);
    }
  }

  async function renewPlan() {
    if (renewing) return;
    setRenewing(true);
    try {
      await api('/mentor/plan/renew', { method: 'POST' });
      await loadPlan();
      // Also reload tasks as they are generated anew
      const t = await api<Task[]>('/mentor/tasks');
      setTasks(t);
    } catch (e) {
      console.warn('Renew failed', e);
    } finally {
      setRenewing(false);
    }
  }

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
      const err: Message = { id: (Date.now() + 1).toString(), me: false, text: t('mentor.errorMessage') };
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
    { key: 'chat', label: t('mentor.tabChat') },
    { key: 'tasks', label: t('mentor.tabTasks') },
    { key: 'plan', label: t('mentor.tabPlan') },
  ];

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.root}>
          {/* Header */}
          <View style={[styles.header, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
            <View style={styles.aiDot}><Sparkles size={24} color={colors.brand} /></View>
            <View style={{ flex: 1, alignItems: i18n.dir() === 'rtl' ? 'flex-end' : 'flex-start' }}>
              <Text style={[type.h2, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('mentor.title')}</Text>
              <Text style={[styles.subtitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{t('mentor.subtitle')}</Text>
            </View>
          </View>

          {/* Tab switcher */}
          <View style={[styles.tabs, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
            {TABS.map((tItem) => (
              <Pressable key={tItem.key} onPress={() => setTab(tItem.key)} style={[styles.tabItem, tab === tItem.key && styles.tabActive]}>
                <Text style={[styles.tabText, tab === tItem.key && styles.tabTextActive]}>{tItem.label}</Text>
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
                  <View style={[styles.row, m.me ? styles.rowMe : styles.rowAi, { flexDirection: m.me ? (i18n.dir() === 'rtl' ? 'row-reverse' : 'row') : (i18n.dir() === 'rtl' ? 'row' : 'row-reverse') }]}>
                    {!m.me && (
                      <View style={styles.avatar}><Bot size={18} color={colors.brand} /></View>
                    )}
                    <GlassCard
                      style={[styles.bubble, m.me && styles.bubbleMe]}
                      intensity={m.me ? 20 : 45}
                    >
                      <Text style={[styles.msgText, m.me && styles.msgTextMe, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{m.text}</Text>
                    </GlassCard>
                  </View>
                )}
              />
              <View style={[styles.inputRow, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                <Pressable onPress={send} style={[styles.sendBtn, !input.trim() && { opacity: 0.4 }]}>
                  <Send size={18} color="#06121f" style={{ marginLeft: i18n.dir() === 'rtl' ? -2 : 2, transform: [{ scaleX: i18n.dir() === 'rtl' ? 1 : -1 }] }} />
                </Pressable>
                <TextInput
                  style={[styles.input, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}
                  placeholder={t('mentor.inputPlaceholder')}
                  placeholderTextColor={colors.textLo}
                  value={input}
                  onChangeText={setInput}
                  multiline
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
                  <Text style={[type.body, { textAlign: 'center', marginTop: spacing.sm }]}>{t('mentor.noTasks')}</Text>
                </View>
              ) : tasks.map((tk) => (
                <Pressable key={tk.id} onPress={() => toggleTask(tk)}>
                  <GlassCard style={[styles.taskRow, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                    <View style={[styles.check, tk.status === 'done' && styles.checkDone]}>
                      {tk.status === 'done' && <Check size={16} color="#06121f" />}
                    </View>
                    <Text style={[styles.taskText, tk.status === 'done' && styles.taskDone, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                      {i18n.language === 'en' ? (tk.titleEn || tk.titleAr) : tk.titleAr}
                    </Text>
                  </GlassCard>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* PLAN */}
          {tab === 'plan' && (
            <ScrollView contentContainerStyle={styles.section}>
              {planLoading ? (
                <View style={styles.empty}>
                  <Text style={[type.body, { color: colors.textLo }]}>{t('mentor.loadingPlan')}</Text>
                </View>
              ) : !plan ? (
                <GlassCard style={styles.planCard}>
                  <FileText size={40} color={colors.textLo} style={{ alignSelf: 'center' }} />
                  <Text style={[type.h2, { textAlign: 'center', marginTop: spacing.md }]}>{t('mentor.noPlanYet')}</Text>
                  <Text style={[type.body, { textAlign: 'center', color: colors.textLo, marginTop: spacing.sm }]}>
                    {t('mentor.completeAssessment')}
                  </Text>
                </GlassCard>
              ) : (
                <GlassCard style={styles.planCard}>
                  <Text style={[type.h2, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', marginBottom: spacing.sm }]}>{t('mentor.myPlan')}</Text>
                  {plan.planJson?.goals && Array.isArray(plan.planJson.goals) && (
                    <>
                      <Text style={[type.body, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', color: colors.textLo, marginBottom: spacing.sm }]}>{t('mentor.goals')}</Text>
                      {plan.planJson.goals.map((g: string, i: number) => (
                        <View key={i} style={[styles.pillar, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                          <Zap size={20} color={colors.brand} />
                          <Text style={[styles.pillarTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{g}</Text>
                        </View>
                      ))}
                    </>
                  )}
                  {plan.planJson?.pillars && Array.isArray(plan.planJson.pillars) && (
                    <>
                      <Text style={[type.body, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', color: colors.textLo, marginTop: spacing.md, marginBottom: spacing.sm }]}>{t('mentor.pillars')}</Text>
                      {plan.planJson.pillars.map((p: any, i: number) => (
                        <View key={i} style={[styles.pillar, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                          <Brain size={22} color={colors.brand2} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.pillarTitle, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{p.title ?? p}</Text>
                            {p.desc && <Text style={[styles.pillarDesc, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{p.desc}</Text>}
                          </View>
                        </View>
                      ))}
                    </>
                  )}
                  {plan.planJson?.summary && (
                    <Text style={[type.body, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', color: colors.textMid, marginTop: spacing.md }]}>
                      {plan.planJson.summary}
                    </Text>
                  )}
                  {(!plan.planJson?.goals && !plan.planJson?.pillars) && (
                     <Text style={[type.body, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', color: colors.textMid, marginTop: spacing.md }]}>
                      {t('mentor.oldVersionPlan')}
                    </Text>
                  )}
                  <Text style={[styles.pillarDesc, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', marginTop: spacing.md, marginBottom: spacing.md }]}>
                    {t('mentor.createdAt', { date: new Date(plan.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-SA' : 'en-US') })}
                  </Text>

                  <Pressable 
                    onPress={renewPlan} 
                    style={[styles.renewBtn, renewing && { opacity: 0.5 }, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}
                  >
                    <PartyPopper size={18} color="#fff" />
                    <Text style={[type.button, { color: '#fff' }]}>
                      {renewing ? t('mentor.generatingPlan') : t('mentor.generateNewPlan')}
                    </Text>
                  </Pressable>
                </GlassCard>
              )}
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
  msgText: { fontFamily: font.regular, fontSize: 15, color: colors.textHi, lineHeight: 24 },
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
    backgroundColor: colors.glassFill,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 44, backgroundColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  section: { padding: spacing.lg, gap: spacing.sm, paddingBottom: 120 },
  empty: { alignItems: 'center', padding: spacing.xl },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: 14 },
  check: {
    width: 24, height: 24, borderRadius: 24, borderWidth: 2, borderColor: colors.brand,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkDone: { backgroundColor: colors.brand },
  taskText: { fontFamily: font.medium, fontSize: 15, color: colors.textHi, flex: 1 },
  taskDone: { color: colors.textLo, textDecorationLine: 'line-through' },
  planCard: { gap: spacing.md },
  pillar: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginTop: spacing.sm },
  pillarTitle: { fontFamily: font.semiBold, fontSize: 14, color: '#fff', marginBottom: 2 },
  pillarDesc: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
  renewBtn: { backgroundColor: colors.brand, paddingVertical: 12, paddingHorizontal: 24, borderRadius: radii.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: spacing.md },
});
