import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Box, Send, Sparkles, Wand2 } from 'lucide-react-native';
import { colors, font, radii, spacing } from '../src/theme';

type Message = { id: string; text: string; sender: 'user' | 'ai'; is3D?: boolean };

export default function DigitalTwinChat() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'أهلاً بك في التوأم الرقمي! 🥳\nأنا هنا لمساعدتك في بناء وتعديل مجسّم ثلاثي الأبعاد لمناسبتك. كيف تتخيل شكل قاعة الاحتفال؟', sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input.trim(), sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // AI Response Simulation
    setTimeout(() => {
      setTyping(false);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        text: 'لقد قمت بتحديث المجسّم بناءً على طلبك! لقد أضفت إضاءة دافئة ووزعت طاولات الضيوف بشكل دائري حول الممر الرئيسي. تفضل بمعاينة التوأم الرقمي الآن:', 
        sender: 'ai',
        is3D: true
      };
      setMessages(prev => [...prev, aiMsg]);
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 2500);
  }

  return (
    <View style={styles.root}>
      {/* Hero Header */}
      <View style={styles.header}>
        <SafeAreaView edges={['top']} style={styles.headerSafeArea} />
        <View style={styles.headerContent}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color={colors.textHi} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: spacing.md }}>
            <Text style={styles.headerTitle}>التوأم الرقمي</Text>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Box size={12} color={colors.brand} />
              <Text style={styles.headerSub}>مساعدك الشخصي لبناء 3D</Text>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollRef}
          contentContainerStyle={styles.chatScroll} 
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View key={msg.id} style={[styles.messageRow, msg.sender === 'user' ? styles.msgRowUser : styles.msgRowAi]}>
              {msg.sender === 'ai' && (
                <View style={styles.aiAvatar}>
                  <Wand2 size={16} color="#fff" />
                </View>
              )}
              <View style={[styles.bubble, msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAi]}>
                <Text style={[styles.bubbleText, msg.sender === 'user' ? { color: '#fff' } : { color: colors.textHi }]}>
                  {msg.text}
                </Text>

                {msg.is3D && (
                  <View style={styles.previewBox}>
                    <Image source={{ uri: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=80' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
                    <View style={styles.previewBadge}>
                      <Box size={14} color="#fff" />
                      <Text style={styles.previewBadgeText}>معاينة التوأم 3D</Text>
                    </View>
                  </View>
                )}
              </View>
            </View>
          ))}
          
          {typing && (
            <View style={[styles.messageRow, styles.msgRowAi]}>
              <View style={styles.aiAvatar}>
                <Wand2 size={16} color="#fff" />
              </View>
              <View style={[styles.bubble, styles.bubbleAi, { paddingHorizontal: 16 }]}>
                <Text style={styles.typingText}>جاري تحليل وتصميم المجسم...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <Pressable onPress={sendMessage} style={styles.sendBtn}>
            <Send size={18} color="#fff" style={{ marginLeft: -2 }} />
          </Pressable>
          <TextInput
            style={styles.input}
            placeholder="مثال: أضف ممر زهور باللون الأبيض والذهبي..."
            placeholderTextColor={colors.textLo}
            value={input}
            onChangeText={setInput}
            multiline
            textAlign="right"
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: colors.glassBorder, paddingBottom: spacing.md },
  headerSafeArea: { backgroundColor: '#fff' },
  headerContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  headerSub: { fontFamily: font.medium, fontSize: 11, color: colors.textMid },
  
  chatScroll: { padding: spacing.lg, paddingBottom: 30, gap: 16 },
  messageRow: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-start' },
  msgRowAi: { justifyContent: 'flex-start' },
  
  aiAvatar: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
  
  bubble: { maxWidth: '82%', borderRadius: 18, padding: 14, overflow: 'hidden' },
  bubbleUser: { backgroundColor: colors.brand, borderBottomRightRadius: 4 },
  bubbleAi: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.glassBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  bubbleText: { fontFamily: font.regular, fontSize: 14, lineHeight: 22, textAlign: 'right' },
  
  previewBox: { height: 160, borderRadius: radii.md, overflow: 'hidden', marginTop: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  previewBadge: { position: 'absolute', bottom: 12, left: 12, right: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 99, paddingVertical: 8 },
  previewBadgeText: { fontFamily: font.bold, fontSize: 13, color: '#fff' },
  
  typingText: { fontFamily: font.regular, fontSize: 13, color: colors.brand },
  
  inputArea: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 10, padding: spacing.lg, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.glassBorder },
  input: { flex: 1, minHeight: 46, maxHeight: 120, backgroundColor: colors.bg1, borderRadius: 23, paddingHorizontal: 18, paddingVertical: 12, color: colors.textHi, fontFamily: font.regular, fontSize: 14, textAlign: 'right', borderWidth: 1, borderColor: colors.glassBorder },
  sendBtn: { width: 46, height: 46, borderRadius: 23, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center' },
});
