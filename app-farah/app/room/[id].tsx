import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text,
  TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Send } from 'lucide-react-native';
import { api } from '../../src/lib/api';
import { authStore } from '../../src/lib/authStore';
import { colors, font, radii, spacing } from '../../src/theme';

type Msg = {
  id: string; body: string; createdAt: string;
  user: { id: string; fullName?: string; avatarUrl?: string; badges?: { code: string; nameAr: string }[] };
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 60000;
  if (d < 1) return 'الآن';
  if (d < 60) return `${Math.floor(d)} د`;
  if (d < 1440) return `${Math.floor(d / 60)} س`;
  return `${Math.floor(d / 1440)} ي`;
}

export default function Room() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [meId, setMeId] = useState<string>('__me');
  const listRef = useRef<FlatList>(null);
  const loggedIn = authStore.isLoggedIn();

  async function load() {
    if (!id) return;
    try { setMessages(await api<Msg[]>(`/community/rooms/${id}/messages`)); } catch {}
  }
  useEffect(() => { load(); }, [id]);
  useEffect(() => { if (loggedIn) api<{ user: { id: string } }>('/me').then((m) => setMeId(m.user.id)).catch(() => {}); }, [loggedIn]);

  async function send() {
    const body = text.trim();
    if (!body) return;
    if (!loggedIn) { router.push('/login'); return; }
    setText('');
    const temp: Msg = { id: `temp_${Date.now()}`, body, createdAt: new Date().toISOString(), user: { id: meId, fullName: 'أنا' } };
    setMessages((m) => [...m, temp]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    try {
      const real = await api<Msg>(`/community/rooms/${id}/messages`, { method: 'POST', body: { text: body } });
      setMessages((m) => m.map((x) => (x.id === temp.id ? real : x)));
    } catch (e) {
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      setText(body);
    }
  }

  function renderMsg({ item: m }: { item: Msg }) {
    const mine = m.user.id === meId;
    const name = m.user.fullName ?? 'عضو';
    return (
      <View style={[styles.row, mine && styles.rowMine]}>
        {!mine && <View style={styles.avatar}><Text style={styles.avatarText}>{name.charAt(0)}</Text></View>}
        <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
          {!mine && <Text style={styles.sender}>{name}</Text>}
          <Text style={[styles.body, mine && { color: '#fff' }]}>{m.body}</Text>
          <Text style={[styles.time, mine && { color: 'rgba(255,255,255,0.7)' }]}>{timeAgo(m.createdAt)}</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg0 }} edges={['top']}>
      <View style={styles.nav}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}><ArrowRight size={20} color={colors.textHi} /></Pressable>
        <Text style={styles.navTitle}>الغرفة</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMsg}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={<Text style={styles.empty}>كن أول من يكتب رسالة 👋</Text>}
        />
        <SafeAreaView edges={['bottom']} style={styles.inputBar}>
          <Pressable onPress={send} style={styles.sendBtn}><Send size={18} color="#fff" /></Pressable>
          <TextInput
            style={styles.input}
            placeholder={loggedIn ? 'اكتب رسالة...' : 'سجّل الدخول للمشاركة'}
            placeholderTextColor={colors.textLo}
            value={text}
            onChangeText={setText}
            textAlign="right"
            onSubmitEditing={send}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  backBtn: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  navTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  list: { padding: spacing.md, gap: 10, flexGrow: 1 },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  rowMine: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  avatar: { width: 32, height: 32, borderRadius: 32, backgroundColor: colors.brand2, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.bold, fontSize: 14, color: '#fff' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.brand, borderBottomRightRadius: 5 },
  bubbleOther: { backgroundColor: colors.bg1, borderWidth: 1, borderColor: colors.glassBorder, borderBottomLeftRadius: 5 },
  sender: { fontFamily: font.bold, fontSize: 12, color: colors.brand2, textAlign: 'right', marginBottom: 2 },
  body: { fontFamily: font.regular, fontSize: 14.5, color: colors.textHi, textAlign: 'right', lineHeight: 22 },
  time: { fontFamily: font.regular, fontSize: 10, color: colors.textLo, textAlign: 'right', marginTop: 2 },
  empty: { fontFamily: font.regular, fontSize: 14, color: colors.textLo, textAlign: 'center', marginTop: 60 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.glassBorder, backgroundColor: colors.bg1 },
  sendBtn: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, backgroundColor: colors.bg2, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 12, fontFamily: font.regular, fontSize: 15, color: colors.textHi },
});
