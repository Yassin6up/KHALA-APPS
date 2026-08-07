import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { GradientBackground } from '../src/components/GradientBackground';
import { api } from '../src/lib/api';
import { authStore } from '../src/lib/authStore';
import { colors, font, radii, spacing, type } from '../src/theme';
import { useTranslation } from 'react-i18next';
import { Trans } from 'react-i18next';

export default function DeleteAccount() {
  const { t, i18n } = useTranslation();
  const CONFIRM_WORD = t('deleteAccount.confirmWord');
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const canDelete = input.trim() === CONFIRM_WORD;

  async function handleDelete() {
    if (!canDelete) return;
    Alert.alert(
      t('deleteAccount.confirmTitle'),
      t('deleteAccount.confirmBody'),
      [
        { text: t('deleteAccount.cancel'), style: 'cancel' },
        {
          text: t('deleteAccount.confirmDelete'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await api('/me', { method: 'DELETE' });
              await authStore.clear();
              router.replace('/login');
            } catch (e: unknown) {
              Alert.alert(t('deleteAccount.error'), e instanceof Error ? e.message : t('deleteAccount.errorDefault'));
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  }

  return (
    <GradientBackground>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.root}>
          {/* Header */}
          <View style={[styles.header, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Text style={[styles.backArrow, { transform: [{ scaleX: i18n.dir() === 'rtl' ? -1 : 1 }] }]}>›</Text>
            </Pressable>
            <Text style={[type.h1, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left', flex: 1, color: colors.danger }]}>{t('deleteAccount.title')}</Text>
          </View>

          <View style={styles.content}>
            {/* Warning card */}
            <GlassCard style={styles.warningCard} intensity={40}>
              <Text style={{ fontSize: 48, textAlign: 'center' }}>⚠️</Text>
              <Text style={styles.warningTitle}>{t('deleteAccount.warningTitle')}</Text>
              <Text style={[styles.warningBody, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                {t('deleteAccount.warningBody')}
              </Text>
              {[
                t('deleteAccount.lossProgress'),
                t('deleteAccount.lossPoints'),
                t('deleteAccount.lossPlan'),
                t('deleteAccount.lossSub'),
              ].map((item) => (
                <View key={item} style={[styles.lossRow, { flexDirection: i18n.dir() === 'rtl' ? 'row' : 'row-reverse' }]}>
                  <Text style={styles.lossIcon}>✕</Text>
                  <Text style={[styles.lossText, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>{item}</Text>
                </View>
              ))}
            </GlassCard>

            {/* Confirmation input */}
            <GlassCard>
              <Text style={[styles.confirmLabel, { textAlign: i18n.dir() === 'rtl' ? 'right' : 'left' }]}>
                <Trans 
                  i18nKey="deleteAccount.typeWord" 
                  values={{ word: CONFIRM_WORD }}
                  components={{ 1: <Text style={{ color: colors.danger, fontFamily: font.bold }} /> }}
                />
              </Text>
              <TextInput
                style={[styles.input, canDelete && styles.inputReady]}
                placeholder={t('deleteAccount.typeHere', { word: CONFIRM_WORD })}
                placeholderTextColor={colors.textLo}
                value={input}
                onChangeText={setInput}
                textAlign="center"
                autoCapitalize="none"
              />
            </GlassCard>

            {/* Delete button */}
            <Pressable
              onPress={handleDelete}
              disabled={!canDelete || loading}
              style={[styles.deleteBtn, (!canDelete || loading) && styles.deleteBtnDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>🗑️ {t('deleteAccount.btnDelete')}</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>{t('deleteAccount.btnCancel')}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingTop: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
  backBtn: {},
  backArrow: { fontFamily: font.bold, fontSize: 28, color: colors.textMid, transform: [{ scaleX: -1 }] },
  content: { flex: 1, paddingHorizontal: spacing.lg, gap: spacing.md },
  warningCard: { gap: spacing.sm, borderColor: 'rgba(255,107,107,0.3)', borderWidth: 1 },
  warningTitle: { fontFamily: font.bold, fontSize: 18, color: colors.danger, textAlign: 'center', marginVertical: spacing.xs },
  warningBody: { fontFamily: font.medium, fontSize: 14, color: colors.textMid, marginBottom: spacing.xs },
  lossRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'flex-start' },
  lossIcon: { fontFamily: font.bold, fontSize: 13, color: colors.danger },
  lossText: { fontFamily: font.regular, fontSize: 14, color: colors.textMid },
  confirmLabel: { fontFamily: font.regular, color: colors.textMid, marginBottom: spacing.sm, fontSize: 14, lineHeight: 22 },
  input: {
    borderWidth: 1, borderColor: colors.glassBorder, borderRadius: radii.sm,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    color: colors.textHi, fontFamily: font.bold, fontSize: 18,
    backgroundColor: colors.bg2,
  },
  inputReady: { borderColor: colors.danger, color: colors.danger },
  deleteBtn: {
    height: 56, borderRadius: radii.pill, backgroundColor: colors.danger,
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnDisabled: { opacity: 0.35 },
  deleteBtnText: { fontFamily: font.bold, fontSize: 17, color: '#fff' },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  cancelText: { fontFamily: font.medium, color: colors.textLo, fontSize: 14 },
});
