import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { api } from '../src/lib/api';
import { colors, font, spacing, type } from '../src/theme';
import { useTranslation } from 'react-i18next';

/** The competitive edge: a quick smart assessment before entering the app. */
export default function Assessment() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  
  const QUESTIONS = [
    {
      q: t('assessment.q1'),
      options: [t('assessment.q1o1'), t('assessment.q1o2'), t('assessment.q1o3'), t('assessment.q1o4')],
    },
    {
      q: t('assessment.q2'),
      options: [t('assessment.q2o1'), t('assessment.q2o2'), t('assessment.q2o3'), t('assessment.q2o4')],
    },
    {
      q: t('assessment.q3'),
      options: [t('assessment.q3o1'), t('assessment.q3o2'), t('assessment.q3o3'), t('assessment.q3o4')],
    },
  ];

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  const pick = (i: number) => {
    const next = [...answers];
    next[step] = i;
    setAnswers(next);
  };

  const cont = async () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
      return;
    }
    // Last step — submit to backend then navigate
    setLoading(true);
    try {
      await api('/me/assessments', {
        method: 'POST',
        body: {
          kind: 'personality',
          answersJson: {
            q0: QUESTIONS[0].options[answers[0]] ?? null,
            q1: QUESTIONS[1].options[answers[1]] ?? null,
            q2: QUESTIONS[2].options[answers[2]] ?? null,
          },
        },
      });
    } catch {
      // silently ignore — don't block navigation
    } finally {
      setLoading(false);
    }
    router.replace('/(tabs)');
  };

  const current = QUESTIONS[step];
  const progress = (step + 1) / QUESTIONS.length;

  return (
    <GradientBackground>
      <View style={styles.root}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={[styles.count, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
          {t('assessment.questionCount', { step: step + 1, total: QUESTIONS.length })}
        </Text>

        <Text style={[type.h1, styles.q, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{current.q}</Text>

        <View style={styles.options}>
          {current.options.map((opt, i) => {
            const active = answers[step] === i;
            return (
              <Pressable key={i} onPress={() => pick(i)}>
                <GlassCard style={[styles.option, active && styles.optionActive]}>
                  <Text style={[styles.optionText, active && styles.optionTextActive, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                    {opt}
                  </Text>
                </GlassCard>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator color={colors.brand} size="large" />
          ) : (
            <PrimaryButton
              label={step === QUESTIONS.length - 1 ? t('assessment.startJourney') : t('assessment.continue')}
              onPress={cont}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.xl, gap: spacing.md },
  progressTrack: { height: 6, borderRadius: 6, backgroundColor: colors.glassBorder, marginTop: spacing.md },
  progressFill: { height: 6, borderRadius: 6, backgroundColor: colors.brand },
  count: { fontFamily: font.regular, color: colors.textLo },
  q: { marginVertical: spacing.md },
  options: { gap: spacing.md },
  option: { paddingVertical: 18 },
  optionActive: { borderColor: colors.brand },
  optionText: { fontFamily: font.medium, fontSize: 17, color: colors.textHi },
  optionTextActive: { color: colors.brand },
  footer: { marginTop: 'auto' },
});
