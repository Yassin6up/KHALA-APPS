import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, spacing, type } from '../src/theme';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: '🧭',
    title: 'رحلتك تبدأ بالتقييم الذكي',
    body: 'اختبار شخصية وتحليل لأسلوب تعلّمك لنبني لك خطة تطوير خاصة بك.',
  },
  {
    icon: '🤖',
    title: 'مرشدك الذكي معك دائماً',
    body: 'مهام يومية، متابعة شخصية، وإرشادات مبنية على نقاط قوتك.',
  },
  {
    icon: '🎓',
    title: 'ورش ومعسكرات ومكتبة رقمية',
    body: 'محتوى تدريبي عالي الجودة ومجتمع تفاعلي يدعم نموك المستمر.',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const ref = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (index < SLIDES.length - 1) {
      ref.current?.scrollToIndex({ index: index + 1 });
    } else {
      router.push('/login');
    }
  };

  return (
    <GradientBackground>
      <FlatList
        ref={ref}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <View style={[styles.slide, { width }]}>
            <GlassCard style={styles.iconCard}>
              <Text style={styles.icon}>{item.icon}</Text>
            </GlassCard>
            <Text style={[type.h1, styles.title]}>{item.title}</Text>
            <Text style={[type.body, styles.body]}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
        <PrimaryButton
          label={index === SLIDES.length - 1 ? 'ابدأ الآن' : 'التالي'}
          onPress={next}
        />
        <Text style={styles.skip} onPress={() => router.push('/login')}>
          تخطّي
        </Text>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  slide: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.lg },
  iconCard: { width: 140, height: 140, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 64 },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', maxWidth: 320 },
  footer: { padding: spacing.xl, gap: spacing.md },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.glassBorder },
  dotActive: { width: 26, backgroundColor: colors.brand },
  skip: { fontFamily: font.medium, color: colors.textLo, textAlign: 'center', fontSize: 14 },
});
