import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { colors, font, spacing, type } from '../src/theme';

/** The competitive edge: a quick smart assessment before entering the app. */
const QUESTIONS = [
  {
    q: 'ما الذي تريد تطويره أكثر؟',
    options: ['الثقة بالنفس', 'القيادة', 'إدارة الوقت', 'التواصل'],
  },
  {
    q: 'كيف تفضّل أن تتعلّم؟',
    options: ['بالفيديو', 'بالقراءة', 'بالتطبيق العملي', 'بالنقاش الجماعي'],
  },
  {
    q: 'كم من الوقت تستطيع الالتزام يومياً؟',
    options: ['١٠ دقائق', '٣٠ دقيقة', 'ساعة', 'أكثر من ساعة'],
  },
];

export default function Assessment() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);

  const pick = (i: number) => {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
  };

  const cont = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    else router.replace('/paywall');
  };

  const current = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.count}>
          سؤال {step + 1} من {QUESTIONS.length}
        </Text>

        <Text style={[type.h1, styles.q]}>{current.q}</Text>

        <View style={styles.options}>
          {current.options.map((opt, i) => {
            const active = answers[step] === i;
            return (
              <Pressable key={i} onPress={() => pick(i)}>
                <GlassCard style={[styles.option, active && styles.optionActive]}>
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {opt}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          <PrimaryButton
            label={step === QUESTIONS.length - 1 ? 'عرض خطتي' : 'متابعة'}
            onPress={cont}
          />
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.md },
  progressTrack: { height: 6, borderRadius: 6, backgroundColor: colors.glassBorder, marginTop: spacing.md },
  progressFill: { height: 6, borderRadius: 6, backgroundColor: colors.brand },
  count: { fontFamily: font.regular, color: colors.textLo, textAlign: 'right' },
  q: { textAlign: 'right', marginVertical: spacing.md },
  options: { gap: spacing.md },
  option: { paddingVertical: 18 },
  optionActive: { borderColor: colors.brand },
  optionText: { fontFamily: font.medium, fontSize: 17, color: colors.textHi, textAlign: 'right' },
  optionTextActive: { color: colors.brand },
  footer: { marginTop: 'auto' },
});
