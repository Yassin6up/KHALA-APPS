import { router, useLocalSearchParams } from 'expo-router';
import { getBadgeImage } from '../../src/lib/badgeImages';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowRight,
  Send,
  MessageCircle,
  Smile,
  Sparkles,
  X,
  Star,
  Calendar,
  Users,
  BookOpen,
  Crown,
  Shield,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { colors, font, radii, spacing } from '../../src/theme';

const { height: SCREEN_H } = Dimensions.get('window');

// ── types ─────────────────────────────────────────────────────────────────

type Badge = { code: string; nameAr: string; iconUrl?: string };

type Msg = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; fullName?: string; avatarUrl?: string; badges?: Badge[] };
};

type Room = { id: string; nameAr: string; memberCount: number; messageCount: number };

type ProfileData = {
  user: { id: string; fullName?: string; avatarUrl?: string; createdAt: string };
  roomsCount: number;
  libraryCount: number;
  badges: Badge[];
  coverUrl: string;
  plan?: string;
};

// ── emoji panel data ──────────────────────────────────────────────────────

const EMOJI_CATS = [
  { label: '😊', emojis: ['😊','😂','🤣','❤️','😍','🥰','😘','😎','🤩','🥳','😁','😄','😅','🤗','😌','🤭','😇','🥺','😢','😭','😤','😠','😱','🤔','🙄','😴','🤤','🥱','😋','😜'] },
  { label: '👋', emojis: ['👋','🤝','👍','👎','👏','🙌','🤲','🙏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','✊','👊','🤛','🤜','💪','🦾','🖐️','✋','🖖','👌','🤌','🤏'] },
  { label: '🔥', emojis: ['🔥','⭐','🌟','✨','💫','🎯','🎉','🎊','🏆','🥇','🎖️','🌈','💎','👑','🚀','💡','⚡','🌙','☀️','🌺','🌸','💐','🌴','🍀','🌊','❄️','🌪️','💥','🎵','🎶'] },
  { label: '❤️', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💞','💓','💗','💖','💝','💘','💟','❣️','💔','♥️','🫀','💋','😻','💑','👫','🤱','👶','🧒','🧑','🧓'] },
  { label: '🌍', emojis: ['🌍','🏠','🏢','🏫','🏥','🏦','🕌','⛪','🏰','🗼','🗽','🗺️','🌏','🌎','🏖️','🏔️','🌋','🏕️','🗻','🌄','🌅','🌆','🌇','🌃','🌉','🎡','🎢','🎠','🌌','🌠'] },
];

// ── badge code → emoji ────────────────────────────────────────────────────

function badgeImage(code: string) {
  return getBadgeImage(code);
}

// ── cover images (varied by user id hash) ────────────────────────────────

// picsum.photos — dead-reliable, no auth needed, consistent per ID
const COVERS = [
  'https://picsum.photos/id/29/900/320',   // sandy beach – warm light
  'https://picsum.photos/id/96/900/320',   // yellow flower field – bright
  'https://picsum.photos/id/119/900/320',  // colorful books – vivid
  'https://picsum.photos/id/137/900/320',  // ocean shore – light blue
  'https://picsum.photos/id/10/900/320',   // forest stream – greens
];

function coverForId(id: string) {
  const hash = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return COVERS[hash % COVERS.length];
}

// ── helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'الآن';
  if (m < 60) return `${m}د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}س`;
  return `${Math.floor(h / 24)}ي`;
}

function accountAge(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days < 1) return 'اليوم';
  if (days < 30) return `${days} يوم`;
  if (days < 365) return `${Math.floor(days / 30)} شهر`;
  return `${Math.floor(days / 365)} سنة`;
}

const PALETTE: readonly (readonly [string, string])[] = [
  ['#2EC5B6', '#1aa39c'],
  ['#6C8BFF', '#4a6fe8'],
  ['#F59E0B', '#d97706'],
  ['#EF4444', '#dc2626'],
  ['#8B5CF6', '#7c3aed'],
] as const;

function avatarGrad(name: string): readonly [string, string] {
  return PALETTE[(name.charCodeAt(0) || 0) % PALETTE.length];
}

const URL_REGEX = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/i;

// ── component ─────────────────────────────────────────────────────────────

export default function ChatRoom() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [meName, setMeName] = useState('أنا');
  const [meAvatarUrl, setMeAvatarUrl] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState(0);

  // profile modal
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const sheetAnim = useRef(new Animated.Value(SCREEN_H)).current;

  const flatRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // ── load ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    api<{ user: { id: string; fullName?: string; avatarUrl?: string } }>('/me')
      .then((d) => {
        setMeId(d.user.id);
        setMeName(d.user.fullName ?? 'أنا');
        setMeAvatarUrl(d.user.avatarUrl ?? null);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Msg[]>(`/community/rooms/${id}/messages`).catch(() => [] as Msg[]),
      api<Room[]>('/community/rooms').catch(() => [] as Room[]),
    ]).then(([msgs, rooms]) => {
      setMessages(msgs);
      const found = rooms.find((r) => r.id === id);
      if (found) setRoom(found);
    }).finally(() => setLoading(false));
  }, [id]);



  // ── send with optimistic UI ───────────────────────────────────────────────

  async function send() {
    const txt = input.trim();
    if (!txt || sending || !id) return;
    if (URL_REGEX.test(txt)) {
      Alert.alert('غير مسموح', 'لا يمكن إرسال روابط في المجتمع.');
      return;
    }

    setInput('');
    setShowCommands(false);
    setShowEmoji(false);

    const tempId = `temp_${Date.now()}`;
    const optimistic: Msg = {
      id: tempId,
      body: txt,
      createdAt: new Date().toISOString(),
      user: {
        id: meId ?? '__me',
        fullName: meName,
        avatarUrl: meAvatarUrl ?? undefined,
        badges: [],
      },
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);

    setSending(true);
    try {
      const msg = await api<Msg>(`/community/rooms/${id}/messages`, {
        method: 'POST',
        body: { text: txt },
      });
      setMessages((prev) => prev.map((m) => (m.id === tempId ? msg : m)));
    } catch (e) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(txt);
      Alert.alert('فشل الإرسال', e instanceof Error ? e.message : 'تحقق من الاتصال');
    } finally {
      setSending(false);
    }
  }

  // ── profile modal ─────────────────────────────────────────────────────────

  function openProfile(userId: string) {
    setProfileUserId(userId);
    setProfileData(null);
    setProfileLoading(true);
    Keyboard.dismiss();
    setShowEmoji(false);

    Animated.spring(sheetAnim, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 3,
    }).start();

    api<ProfileData>(`/community/users/${userId}/profile`)
      .then((d) => setProfileData(d))
      .catch(() => {
        const msgUser = messages.find((m) => m.user.id === userId)?.user;
        setProfileData({
          user: {
            id: userId,
            fullName: msgUser?.fullName,
            avatarUrl: msgUser?.avatarUrl,
            createdAt: new Date().toISOString(),
          },
          roomsCount: 0,
          libraryCount: 0,
          badges: msgUser?.badges ?? [],
          coverUrl: coverForId(userId),
        });
      })
      .finally(() => setProfileLoading(false));
  }

  function closeProfile() {
    Animated.timing(sheetAnim, {
      toValue: SCREEN_H,
      duration: 280,
      useNativeDriver: true,
    }).start(() => {
      setProfileUserId(null);
      setProfileData(null);
    });
  }

  // ── emoji ─────────────────────────────────────────────────────────────────

  function toggleEmoji() {
    if (showEmoji) {
      setShowEmoji(false);
      inputRef.current?.focus();
    } else {
      Keyboard.dismiss();
      setShowEmoji(true);
    }
  }

  // ── sub-components ────────────────────────────────────────────────────────

  function AvatarView({ user, size = 32 }: { user: Msg['user']; size?: number }) {
    const name = user.fullName ?? 'م';
    const [c1, c2] = avatarGrad(name);
    if (user.avatarUrl) {
      return (
        <Image
          source={{ uri: user.avatarUrl }}
          style={{ width: size, height: size, borderRadius: size }}
        />
      );
    }
    return (
      <LinearGradient
        colors={[c1, c2]}
        style={{ width: size, height: size, borderRadius: size, alignItems: 'center', justifyContent: 'center' }}
      >
        <Text style={{ fontFamily: font.bold, fontSize: size * 0.42, color: '#fff' }}>
          {name.charAt(0)}
        </Text>
      </LinearGradient>
    );
  }

  function StatBox({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
    return (
      <View style={styles.statBox}>
        <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={styles.statVal}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    );
  }

  // ── message renderer ──────────────────────────────────────────────────────

  function renderMsg({ item: m, index }: { item: Msg; index: number }) {
    const mine = m.user.id === meId || m.user.id === '__me';
    const isTemp = m.id.startsWith('temp_');
    const name = mine ? meName : (m.user.fullName ?? 'مستخدم');
    const badges = (mine ? [] : (m.user.badges ?? []));
    const userData = mine
      ? { id: meId ?? '', fullName: meName, avatarUrl: meAvatarUrl ?? undefined }
      : m.user;

    // group consecutive same-sender messages — collapse avatar/name for 2nd+
    const prev = messages[index - 1];
    const prevMine = prev && (prev.user.id === meId || prev.user.id === '__me');
    const grouped = !!prev && (mine ? prevMine : !prevMine && prev.user.id === m.user.id);

    return (
      <View style={[styles.msgRow, mine && styles.msgRowMe, grouped && styles.msgRowGrouped]}>

        {/* Avatar — hidden in grouped rows, replaced by spacer */}
        {grouped ? (
          <View style={styles.avatarSpacer} />
        ) : (
          <Pressable onPress={() => openProfile(m.user.id)} hitSlop={8}>
            <View style={styles.avatarRing}>
              <AvatarView user={userData} size={38} />
            </View>
          </Pressable>
        )}

        {/* Bubble card */}
        <View style={[styles.msgCard, mine && styles.msgCardMe, isTemp && styles.msgCardTemp]}>

          {/* Header: name + badges (only first in group) */}
          {!grouped && (
            <Pressable onPress={() => openProfile(m.user.id)} style={[styles.msgHeader, mine && styles.msgHeaderMe]}>
              <Text style={[styles.msgSender, mine && styles.msgSenderMe]}>{name}</Text>
              {badges.slice(0, 3).map((b) => (
                <View key={b.code} style={styles.badgePill}>
                  <Image source={badgeImage(b.code)} style={styles.badgePillImg} />
                </View>
              ))}
            </Pressable>
          )}

          {/* Message text */}
          {mine ? (
            <LinearGradient
              colors={['#2EC5B6', '#1da89e']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.bubbleGrad}
            >
              <Text style={styles.bubbleTextMe}>{m.body}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.bubbleOther}>
              <Text style={styles.bubbleText}>{m.body}</Text>
            </View>
          )}

          {/* Time footer */}
          <Text style={[styles.msgTime, mine && styles.msgTimeMe]}>
            {timeAgo(m.createdAt)}{isTemp ? ' ⏳' : ''}
          </Text>
        </View>
      </View>
    );
  }

  // ── profile sheet ─────────────────────────────────────────────────────────

  const isOwnProfile = profileUserId === meId;
  const profileName = profileData?.user.fullName ?? (isOwnProfile ? meName : 'مستخدم');
  const [pc1, pc2] = avatarGrad(profileName);
  const cover = profileData?.coverUrl ?? coverForId(profileUserId ?? '');

  // ── main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <View style={styles.glowTL} />
      <View style={styles.glowBR} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <ArrowRight size={20} color={colors.textMid} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {room?.nameAr ?? 'غرفة المجتمع'}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSub}>{room ? `${room.memberCount} عضو` : 'نشط'}</Text>
            </View>
          </View>

          <View style={styles.headerBadge}>
            <MessageCircle size={18} color={colors.brand} />
          </View>
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          {/* ── Messages ── */}
          {loading ? (
            <View style={styles.loadingWrap}>
              {[70, 45, 60, 50].map((w, i) => (
                <View key={i} style={[styles.skelRow, i % 2 === 0 && styles.skelRowMe]}>
                  {i % 2 !== 0 && <View style={styles.skelAvatar} />}
                  <View style={[styles.skelBubble, { width: `${w}%` as any }]} />
                </View>
              ))}
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}>
                <MessageCircle size={32} color={colors.brand} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد رسائل بعد</Text>
              <Text style={styles.emptySub}>ابدأ النقاش وكن أول من يشارك</Text>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMsg}
              contentContainerStyle={styles.msgList}
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
              showsVerticalScrollIndicator={false}
              keyboardDismissMode="interactive"
            />
          )}

          {/* Typing */}
          {typingUser && (
            <View style={styles.typingRow}>
              <View style={styles.typingBubble}>
                <View style={styles.dots}>
                  {[0.4, 0.7, 1].map((op, i) => (
                    <View key={i} style={[styles.dot, { opacity: op }]} />
                  ))}
                </View>
              </View>
              <Text style={styles.typingLabel}>{typingUser} يكتب…</Text>
            </View>
          )}

          {/* Slash command */}
          {showCommands && (
            <Pressable
              onPress={() => { setInput('/farah '); setShowCommands(false); inputRef.current?.focus(); }}
              style={styles.commandCard}
            >
              <Sparkles size={15} color={colors.brand} />
              <View style={{ flex: 1 }}>
                <Text style={styles.commandName}>/farah — اسأل المرشد الذكي</Text>
                <Text style={styles.commandHint}>اكتب سؤالك بعد /farah</Text>
              </View>
            </Pressable>
          )}

          {/* ── Input bar ── */}
          <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
            <View style={styles.inputBar}>
              <Pressable onPress={toggleEmoji} style={[styles.iconBtn, showEmoji && styles.iconBtnActive]} hitSlop={6}>
                {showEmoji
                  ? <X size={20} color={colors.brand} />
                  : <Smile size={20} color={colors.textLo} />}
              </Pressable>

              <TextInput
                ref={inputRef}
                style={styles.inputField}
                placeholder="اكتب رسالتك…"
                placeholderTextColor={colors.textLo}
                value={input}
                onChangeText={(v) => {
                  setInput(v);
                  setShowCommands(v === '/');
                  if (v !== '/' && showCommands) setShowCommands(false);
                }}
                onFocus={() => { if (showEmoji) setShowEmoji(false); }}
                multiline
                textAlign="right"
                textAlignVertical="center"
                maxLength={500}
              />

              <Pressable
                onPress={send}
                disabled={!input.trim() || sending}
                style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnOff]}
              >
                {sending
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Send size={17} color="#fff" />}
              </Pressable>
            </View>
          </SafeAreaView>

          {/* ── Emoji panel ── */}
          {showEmoji && (
            <View style={styles.emojiPanel}>
              <View style={styles.emojiTabs}>
                {EMOJI_CATS.map((cat, i) => (
                  <Pressable
                    key={i}
                    onPress={() => setEmojiTab(i)}
                    style={[styles.emojiTabBtn, emojiTab === i && styles.emojiTabActive]}
                  >
                    <Text style={styles.emojiTabLabel}>{cat.label}</Text>
                  </Pressable>
                ))}
              </View>
              <FlatList
                data={EMOJI_CATS[emojiTab].emojis}
                keyExtractor={(e) => e}
                numColumns={8}
                renderItem={({ item }) => (
                  <Pressable style={styles.emojiCell} onPress={() => setInput((p) => p + item)}>
                    <Text style={styles.emojiChar}>{item}</Text>
                  </Pressable>
                )}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.emojiGrid}
                keyboardShouldPersistTaps="always"
              />
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* ── Profile bottom sheet ── */}
      <Modal
        visible={!!profileUserId}
        transparent
        animationType="none"
        onRequestClose={closeProfile}
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={closeProfile} />

        <Animated.View style={[styles.sheet, { transform: [{ translateY: sheetAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Header / drag pill + close button */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetPill} />
              <Pressable onPress={closeProfile} style={styles.closeBtn} hitSlop={10}>
                <X size={18} color={colors.textHi} />
              </Pressable>
            </View>

            {/* Avatar overlapping cover bottom */}
            <View style={styles.profileHead}>
              <View style={styles.avatarBorder}>
                {profileData?.user.avatarUrl ? (
                  <Image source={{ uri: profileData.user.avatarUrl }} style={styles.profileAvatar} />
                ) : (
                  <LinearGradient colors={[pc1, pc2]} style={styles.profileAvatar}>
                    <Text style={styles.profileAvatarText}>{profileName.charAt(0)}</Text>
                  </LinearGradient>
                )}
              </View>

              <View style={styles.profileTitleBlock}>
                {profileLoading ? (
                  <View style={{ width: 120, height: 20, backgroundColor: colors.bg2, borderRadius: 6 }} />
                ) : (
                  <>
                    <Text style={styles.profileName}>{profileName}</Text>
                    {isOwnProfile && (
                      <Text style={styles.profileYouLabel}>ملفي الشخصي</Text>
                    )}
                  </>
                )}
              </View>
            </View>

            {profileLoading ? (
              <View style={styles.loadingCenter}>
                <ActivityIndicator color={colors.brand} size="large" />
              </View>
            ) : profileData ? (
              <View style={styles.profileBody}>

                {/* Badges */}
                {profileData.badges.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>الأوسمة</Text>
                    <View style={styles.badgesWrap}>
                      {profileData.badges.map((b) => (
                        <View key={b.code} style={styles.badgeChip}>
                          <Image source={badgeImage(b.code)} style={styles.badgeChipImg} />
                          <Text style={styles.badgeChipName}>{b.nameAr}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Stats grid */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>الإحصائيات</Text>
                  <View style={styles.statsGrid}>
                    <StatBox icon={Calendar} label="عمر الحساب" value={accountAge(profileData.user.createdAt)} color={colors.brand} />
                    <StatBox icon={Users} label="الغرف" value={`${profileData.roomsCount}`} color="#6C8BFF" />
                    <StatBox icon={BookOpen} label="المكتبة" value={`${profileData.libraryCount}`} color="#F59E0B" />
                    <StatBox icon={Star} label="الأوسمة" value={`${profileData.badges.length}`} color="#EF4444" />
                  </View>
                </View>

                {/* Plan */}
                {profileData.plan && (
                  <View style={[styles.section, styles.planRow]}>
                    <Crown size={18} color="#F59E0B" />
                    <Text style={styles.planText}>{profileData.plan}</Text>
                  </View>
                )}

                {/* Member since */}
                <View style={styles.memberRow}>
                  <Shield size={15} color={colors.textLo} />
                  <Text style={styles.memberText}>
                    {'عضو منذ '}
                    {new Date(profileData.user.createdAt).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                    })}
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </Modal>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg0 },
  glowTL: { position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: 200, backgroundColor: '#2EC5B6', opacity: 0.055 },
  glowBR: { position: 'absolute', bottom: -40, left: -40, width: 160, height: 160, borderRadius: 160, backgroundColor: '#6C8BFF', opacity: 0.045 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, backgroundColor: colors.bg1, gap: spacing.sm },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 2 },
  headerTitle: { fontFamily: font.bold, fontSize: 15, color: colors.textHi },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 7, backgroundColor: '#10B981' },
  headerSub: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  headerAvatarBtn: { borderRadius: 18, overflow: 'hidden' },
  headerBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(46,197,182,0.10)', alignItems: 'center', justifyContent: 'center' },

  // Skeleton
  loadingWrap: { flex: 1, padding: spacing.lg, gap: spacing.md },
  skelRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm },
  skelRowMe: { justifyContent: 'flex-end' },
  skelAvatar: { width: 34, height: 34, borderRadius: 34, backgroundColor: colors.bg2 },
  skelBubble: { height: 42, borderRadius: radii.md, backgroundColor: colors.bg2 },

  // Empty
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  emptyIcon: { width: 68, height: 68, borderRadius: 68, backgroundColor: 'rgba(46,197,182,0.09)', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: font.bold, fontSize: 16, color: colors.textHi },
  emptySub: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'center' },

  // Messages
  msgList: { paddingHorizontal: spacing.md, paddingVertical: spacing.md, paddingBottom: spacing.xl },
  msgRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  msgRowMe: { flexDirection: 'row-reverse' },
  msgRowGrouped: { marginBottom: 4 },

  // Avatar
  avatarRing: {
    width: 42, height: 42, borderRadius: 42,
    borderWidth: 2, borderColor: colors.glassBorder,
    overflow: 'hidden', flexShrink: 0,
  },
  avatarSpacer: { width: 42, flexShrink: 0 },

  // Message card wrapper
  msgCard: { flex: 1, maxWidth: '78%', gap: 0 },
  msgCardMe: { alignItems: 'flex-end' },
  msgCardTemp: { opacity: 0.6 },

  // Header: name + badge pills
  msgHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 5, paddingHorizontal: 2,
  },
  msgHeaderMe: { flexDirection: 'row-reverse' },
  msgSender: { fontFamily: font.bold, fontSize: 13, color: colors.textHi },
  msgSenderMe: { color: colors.brand },
  badgePill: {
    backgroundColor: 'rgba(46,197,182,0.10)',
    borderRadius: 99, padding: 4,
  },
  badgePillImg: { width: 14, height: 14 },

  // Bubbles
  bubbleGrad: {
    borderRadius: 18, borderBottomRightRadius: 4,
    paddingHorizontal: 15, paddingVertical: 11,
  },
  bubbleOther: {
    backgroundColor: colors.bg1,
    borderRadius: 18, borderBottomLeftRadius: 4,
    paddingHorizontal: 15, paddingVertical: 11,
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: '#0D1B2A', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  bubbleText: {
    fontFamily: font.regular, fontSize: 15,
    color: colors.textHi, lineHeight: 23, textAlign: 'right',
  },
  bubbleTextMe: {
    fontFamily: font.regular, fontSize: 15,
    color: '#fff', lineHeight: 23, textAlign: 'right',
  },

  // Time
  msgTime: {
    fontFamily: font.regular, fontSize: 10,
    color: colors.textLo, marginTop: 4, marginLeft: 4,
  },
  msgTimeMe: { textAlign: 'right', marginLeft: 0, marginRight: 4 },

  // Typing
  typingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingBottom: 6, gap: spacing.sm },
  typingBubble: { backgroundColor: colors.bg1, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.md, borderBottomLeftRadius: 4, paddingHorizontal: 12, paddingVertical: 9 },
  dots: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 6, backgroundColor: colors.brand },
  typingLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },

  // Slash command
  commandCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.bg1, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  commandName: { fontFamily: font.bold, fontSize: 13, color: colors.brand, textAlign: 'right' },
  commandHint: { fontFamily: font.regular, fontSize: 11, color: colors.textLo, textAlign: 'right' },

  // Input bar
  inputSafe: { backgroundColor: colors.bg1 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 10, borderTopWidth: 1, borderTopColor: colors.glassBorder, backgroundColor: colors.bg1 },
  iconBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19 },
  iconBtnActive: { backgroundColor: 'rgba(46,197,182,0.10)' },
  inputField: { flex: 1, minHeight: 40, maxHeight: 100, borderRadius: radii.md + 4, borderWidth: 1.5, borderColor: colors.glassBorder, paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 6, color: colors.textHi, fontFamily: font.regular, fontSize: 15, backgroundColor: colors.bg2, textAlign: 'right' },
  sendBtn: { width: 40, height: 40, borderRadius: 40, backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', flexShrink: 0, shadowColor: colors.brand, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 4 },
  sendBtnOff: { backgroundColor: colors.glassBorder, shadowOpacity: 0 },

  // Emoji panel
  emojiPanel: { height: 280, backgroundColor: colors.bg1, borderTopWidth: 1, borderTopColor: colors.glassBorder },
  emojiTabs: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, gap: 4 },
  emojiTabBtn: { flex: 1, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  emojiTabActive: { backgroundColor: 'rgba(46,197,182,0.12)' },
  emojiTabLabel: { fontSize: 20 },
  emojiGrid: { paddingHorizontal: spacing.sm, paddingVertical: 8 },
  emojiCell: { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radii.sm },
  emojiChar: { fontSize: 26 },

  // Profile bottom sheet
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.48)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, height: SCREEN_H * 0.85, backgroundColor: colors.bg1, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  sheetHeader: { width: '100%', height: 50, justifyContent: 'center' },
  sheetPill: { position: 'absolute', top: 10, alignSelf: 'center', left: '50%', marginLeft: -20, width: 40, height: 4, borderRadius: 4, backgroundColor: colors.glassBorder },
  closeBtn: { position: 'absolute', top: 10, right: 14, width: 34, height: 34, borderRadius: 34, backgroundColor: colors.bg2, alignItems: 'center', justifyContent: 'center' },
  profileHead: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: spacing.lg, marginTop: -10, gap: spacing.md, paddingBottom: spacing.sm },
  avatarBorder: { borderWidth: 3, borderColor: colors.bg1, borderRadius: 999, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4 },
  profileAvatar: { width: 84, height: 84, borderRadius: 84, alignItems: 'center', justifyContent: 'center' },
  profileAvatarText: { fontFamily: font.bold, fontSize: 30, color: '#fff' },
  profileTitleBlock: { flex: 1, paddingBottom: 8, gap: 3 },
  profileName: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  profileYouLabel: { fontFamily: font.regular, fontSize: 12, color: colors.brand },
  loadingCenter: { paddingVertical: 60, alignItems: 'center' },
  profileBody: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, gap: spacing.lg },
  section: { gap: spacing.sm },
  sectionTitle: { fontFamily: font.bold, fontSize: 13, color: colors.textMid, textAlign: 'right' },
  badgesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  badgeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bg2, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.pill, gap: 6 },
  badgeChipImg: { width: 24, height: 24 },
  badgeChipName: { fontFamily: font.medium, fontSize: 13, color: colors.textHi },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statBox: { flex: 1, minWidth: '44%', alignItems: 'center', gap: 6, backgroundColor: colors.bg2, borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: colors.glassBorder },
  statIcon: { width: 38, height: 38, borderRadius: 38, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontFamily: font.bold, fontSize: 18, color: colors.textHi },
  statLabel: { fontFamily: font.regular, fontSize: 11, color: colors.textLo },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: radii.md, padding: spacing.md, borderWidth: 1, borderColor: 'rgba(245,158,11,0.20)' },
  planText: { fontFamily: font.bold, fontSize: 14, color: '#d97706' },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberText: { fontFamily: font.regular, fontSize: 13, color: colors.textLo },
});
