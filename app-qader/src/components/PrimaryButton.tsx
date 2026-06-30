import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, font, gradients, radii } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  loading,
  variant = 'brand',
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'brand' | 'glass';
}) {
  if (variant === 'glass') {
    return (
      <Pressable onPress={onPress} style={[styles.base, styles.outline]}>
        <Text style={[styles.label, { color: colors.textMid }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.base}>
      <LinearGradient
        colors={gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.label, styles.labelOnBrand]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radii.pill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  label: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  labelOnBrand: { color: '#fff' },
});
