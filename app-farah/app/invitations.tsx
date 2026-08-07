import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View, Animated, Easing, Share as RNShare, Alert, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Sparkles, Image as ImageIcon, Link, Check, Wand2, Eye, Share2, UploadCloud, X, Calendar, Clock } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { GlassCard } from '../src/components/GlassCard';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { INVITE_TYPES, INVITE_TEMPLATES } from '../src/data/farah';
import { colors, font, radii, spacing } from '../src/theme';
import { api, BASE, APP_KEY } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';

export default function Invitations() {
  const [selectedType, setSelectedType] = useState(INVITE_TYPES[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(INVITE_TEMPLATES[0]);
  const [hostA, setHostA] = useState('');
  const [hostB, setHostB] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [dateSelected, setDateSelected] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState('');
  
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (generating) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [generating]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  async function pickImages() {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)]);
    }
  }

  function removeImage(index: number) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  /** Upload a single image to the backend and return its server URL. */
  async function uploadImage(localUri: string): Promise<string> {
    const filename = localUri.split('/').pop() || 'photo.jpg';
    const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: filename,
      type: mimeType,
    } as any);

    const token = authStore.getAccessToken();
    const res = await fetch(`${BASE}/invitations/upload`, {
      method: 'POST',
      headers: {
        'x-app-key': APP_KEY,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) throw new Error('فشل رفع الصورة');
    const data = await res.json() as { url: string };
    return data.url;
  }

  async function generateLink() {
    if (!hostA) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم المضيف أولاً');
      return;
    }
    if (!dateSelected) {
      Alert.alert('تنبيه', 'يرجى اختيار تاريخ المناسبة');
      return;
    }

    setGenerating(true);
    setLink('');

    try {
      // 1. Upload all selected images to the backend
      const uploadedUrls: string[] = [];
      for (const localUri of images) {
        const serverUrl = await uploadImage(localUri);
        uploadedUrls.push(serverUrl);
      }

      // 2. Create the invitation via the API — this saves it to the database
      const result = await api<{ id: string; url: string }>('/invitations', {
        method: 'POST',
        body: {
          type: selectedType.key,
          template: selectedTemplate.key,
          hostA: hostA.trim(),
          hostB: hostB.trim() || undefined,
          venueAr: location.trim() || undefined,
          eventDate: eventDate.toISOString(),
          images: uploadedUrls,
        },
      });

      setLink(result.url);
    } catch (err: any) {
      Alert.alert('خطأ', err.message || 'حدث خطأ أثناء إنشاء الدعوة');
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard() {
    await Clipboard.setStringAsync(link);
    Alert.alert('تم النسخ', 'تم نسخ الرابط إلى الحافظة بنجاح!');
  }

  async function shareLink() {
    try {
      await RNShare.share({
        message: `دعوة خاصة: ${selectedType.title}\nمن: ${hostA}${hostB ? ` و ${hostB}` : ''}\nاضغط هنا لعرض التفاصيل وتأكيد الحضور:\n${link}`,
      });
    } catch (error: any) {
      Alert.alert('خطأ', error.message);
    }
  }

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=600&q=80' }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.7)']} style={StyleSheet.absoluteFill} />
        <SafeAreaView edges={['top']} style={styles.heroNav}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowRight size={20} color="#fff" />
          </Pressable>
        </SafeAreaView>
        <View style={styles.heroContent}>
          <View style={[styles.heroIcon, { backgroundColor: '#EC4899' }]}>
            <Sparkles size={19} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>مولّد الدعوات الذكي</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.secTitle}>تفاصيل المناسبة</Text>
        
        {/* Type selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {INVITE_TYPES.map(t => (
            <Pressable key={t.key} onPress={() => setSelectedType(t)} style={[styles.typeChip, selectedType.key === t.key && { backgroundColor: t.tint, borderColor: t.tint }]}>
              <Text style={[styles.typeText, selectedType.key === t.key && { color: '#fff' }]}>{t.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <GlassCard style={styles.formCard}>
          <Text style={styles.label}>{selectedType.hostALabel}</Text>
          <TextInput style={styles.input} placeholder={selectedType.hostALabel} placeholderTextColor={colors.textLo} value={hostA} onChangeText={setHostA} textAlign="right" />
          
          {selectedType.hostBLabel && (
            <>
              <Text style={styles.label}>{selectedType.hostBLabel}</Text>
              <TextInput style={styles.input} placeholder={selectedType.hostBLabel} placeholderTextColor={colors.textLo} value={hostB} onChangeText={setHostB} textAlign="right" />
            </>
          )}

          <Text style={styles.label}>التاريخ والوقت</Text>
          <View style={styles.dateRow}>
            <Pressable onPress={() => setShowDatePicker(true)} style={styles.dateBtn}>
              <Calendar size={18} color={dateSelected ? colors.brand : colors.textLo} />
              <Text style={[styles.dateBtnText, dateSelected && { color: colors.textHi }]}>
                {dateSelected ? eventDate.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'اختر التاريخ'}
              </Text>
            </Pressable>
            <Pressable onPress={() => setShowTimePicker(true)} style={styles.dateBtn}>
              <Clock size={18} color={dateSelected ? colors.brand : colors.textLo} />
              <Text style={[styles.dateBtnText, dateSelected && { color: colors.textHi }]}>
                {dateSelected ? eventDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'اختر الوقت'}
              </Text>
            </Pressable>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_e, selected) => {
                setShowDatePicker(false);
                if (selected) { setEventDate(selected); setDateSelected(true); }
              }}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={eventDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={false}
              onChange={(_e, selected) => {
                setShowTimePicker(false);
                if (selected) { setEventDate(selected); setDateSelected(true); }
              }}
            />
          )}

          <Text style={styles.label}>رابط الموقع (Google Maps)</Text>
          <TextInput style={styles.input} placeholder="ألصق رابط القاعة هنا..." placeholderTextColor={colors.textLo} value={location} onChangeText={setLocation} textAlign="right" />

          <Text style={styles.label}>صور الدعوة (اختياري)</Text>
          <View style={styles.imageGallery}>
            {images.map((img, idx) => (
              <View key={idx} style={styles.imagePreviewWrap}>
                <Image source={{ uri: img }} style={styles.imagePreview} />
                <Pressable onPress={() => removeImage(idx)} style={styles.removeImageBtn}>
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={pickImages} style={styles.uploadBox}>
              <UploadCloud size={24} color={colors.brand} />
              <Text style={styles.uploadText}>رفع صور</Text>
            </Pressable>
          </View>
        </GlassCard>

        <Text style={styles.secTitle}>القالب التصميمي</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {INVITE_TEMPLATES.map(t => (
            <Pressable key={t.key} onPress={() => setSelectedTemplate(t)} style={[styles.templateCard, { backgroundColor: t.bg }, selectedTemplate.key === t.key && styles.templateActive]}>
              <View style={[styles.templateAccent, { backgroundColor: t.accent }]} />
              <Text style={[styles.templateTitle, { color: t.ink }]}>{t.title}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xl }}>
          {!generating && !link && (
            <PrimaryButton 
              label="إنشاء رابط الدعوة" 
              onPress={generateLink} 
              icon={<Wand2 size={18} color="#fff" />}
            />
          )}

          {generating && (
            <View style={styles.loadingBox}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Sparkles size={32} color={colors.brand} />
              </Animated.View>
              <Text style={styles.loadingText}>يتم الآن تصميم وبناء الدعوة بالذكاء الاصطناعي...</Text>
              <Text style={styles.loadingSub}>نقوم بتنسيق الألوان، الصور، والنصوص</Text>
            </View>
          )}

          {link !== '' && !generating && (
            <View style={styles.resultContainer}>
              <View style={styles.linkBox}>
                <View style={styles.linkIcon}><Check size={20} color={colors.success} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.linkTitle}>تم إنشاء الدعوة بنجاح!</Text>
                  <Text style={styles.linkText} selectable>{link}</Text>
                </View>
              </View>

              <View style={styles.actionRow}>
                <Pressable style={styles.actionBtn} onPress={() => Linking.openURL(link)}>
                  <Eye size={18} color={colors.textHi} />
                  <Text style={styles.actionText}>معاينة الدعوة</Text>
                </Pressable>
                
                <Pressable style={styles.actionBtn} onPress={copyToClipboard}>
                  <Link size={18} color={colors.textHi} />
                  <Text style={styles.actionText}>نسخ الرابط</Text>
                </Pressable>
                
                <Pressable style={[styles.actionBtn, { backgroundColor: colors.brand, borderColor: colors.brand }]} onPress={shareLink}>
                  <Share2 size={18} color="#fff" />
                  <Text style={[styles.actionText, { color: '#fff' }]}>مشاركة الرابط</Text>
                </Pressable>
              </View>
              
              <Pressable style={styles.resetBtn} onPress={() => setLink('')}>
                <Text style={styles.resetText}>إنشاء دعوة أخرى</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  hero: { height: 180, justifyContent: 'flex-end' },
  heroNav: { position: 'absolute', top: 0, left: 0, right: 0, padding: spacing.md },
  backBtn: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  heroContent: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: font.bold, fontSize: 22, color: '#fff' },
  scroll: { paddingTop: spacing.md, paddingBottom: spacing.lg },
  secTitle: { fontFamily: font.bold, fontSize: 18, color: colors.textHi, textAlign: 'right', paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md },
  hScroll: { paddingHorizontal: spacing.lg, gap: 10 },
  typeChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 99, borderWidth: 1, borderColor: colors.glassBorder, backgroundColor: colors.bg1 },
  typeText: { fontFamily: font.bold, fontSize: 13, color: colors.textHi },
  formCard: { marginHorizontal: spacing.lg, gap: 12, marginTop: spacing.md },
  label: { fontFamily: font.bold, fontSize: 13, color: colors.textHi, textAlign: 'right' },
  input: { borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 10, padding: 12, color: colors.textHi, fontFamily: font.regular, fontSize: 14, backgroundColor: colors.bg1, textAlign: 'right' },
  dateRow: { flexDirection: 'row-reverse', gap: 10 },
  dateBtn: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: colors.glassBorder, borderRadius: 10, padding: 12, backgroundColor: colors.bg1 },
  dateBtnText: { fontFamily: font.regular, fontSize: 13, color: colors.textLo, textAlign: 'right', flex: 1 },
  imageGallery: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  imagePreviewWrap: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: colors.glassBorder },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeImageBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  uploadBox: { width: 80, height: 80, borderRadius: 10, borderWidth: 1.5, borderColor: colors.glassBorder, borderStyle: 'dashed', backgroundColor: colors.bg1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  uploadText: { fontFamily: font.medium, fontSize: 11, color: colors.brand },
  templateCard: { width: 120, height: 140, borderRadius: radii.md, padding: 12, borderWidth: 2, borderColor: 'transparent', justifyContent: 'flex-end' },
  templateActive: { borderColor: colors.brand },
  templateAccent: { position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 12, opacity: 0.8 },
  templateTitle: { fontFamily: font.bold, fontSize: 14, textAlign: 'right' },
  
  loadingBox: { alignItems: 'center', justifyContent: 'center', padding: 30, backgroundColor: '#FFF5F9', borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder },
  loadingText: { fontFamily: font.bold, fontSize: 16, color: colors.brand, marginTop: 16, textAlign: 'center' },
  loadingSub: { fontFamily: font.regular, fontSize: 13, color: colors.textMid, marginTop: 4, textAlign: 'center' },
  
  resultContainer: { backgroundColor: '#F8FAFC', padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.glassBorder, gap: 16 },
  linkBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 14, backgroundColor: '#DCFCE7', padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: '#BBF7D0' },
  linkIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' },
  linkTitle: { fontFamily: font.bold, fontSize: 15, color: '#166534', textAlign: 'right' },
  linkText: { fontFamily: font.medium, fontSize: 13, color: '#15803D', textAlign: 'right', marginTop: 4 },
  
  actionRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: colors.glassBorder },
  actionText: { fontFamily: font.bold, fontSize: 14, color: colors.textHi },
  
  resetBtn: { padding: 10, alignItems: 'center' },
  resetText: { fontFamily: font.medium, fontSize: 13, color: colors.textMid },
});
