import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, font, gradients, radii } from '../theme';

export function PrimaryButton({
  label,
  onPress,
  loading,
  variant = 'brand',
  icon,
}: {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  variant?: 'brand' | 'gold' | 'glass';
  icon?: React.ReactNode;
}) {
  if (variant === 'glass') {
    return (
      <Pressable onPress={onPress} style={[styles.base, styles.outline]}>
        <Text style={[styles.label, { color: colors.brand }]}>{label}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onPress} style={styles.base}>
      <LinearGradient
        colors={variant === 'gold' ? gradients.gold : gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View style={styles.row}>
          {icon}
          <Text style={[styles.label, styles.labelOnBrand]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { height: 56, borderRadius: radii.pill, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.brand },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: font.bold, fontSize: 17, color: colors.textHi },
  labelOnBrand: { color: '#fff' },
});
