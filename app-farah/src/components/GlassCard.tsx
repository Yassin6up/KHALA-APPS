import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors, radii } from '../theme';

/** Clean white card with subtle elevation. */
export function GlassCard({
  children,
  style,
  intensity: _intensity,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
}) {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    padding: 18,
    // iOS shadow
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 14,
    // Android elevation
    elevation: 2,
  },
});
