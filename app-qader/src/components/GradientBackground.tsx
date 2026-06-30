import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';

/** Clean light background with subtle brand accent. */
export function GradientBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.root}>
      {/* soft teal glow top-right */}
      <View style={styles.glowTeal} />
      {/* soft indigo glow bottom-left */}
      <View style={styles.glowIndigo} />
      <SafeAreaView style={styles.safe}>{children}</SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg0 },
  safe: { flex: 1 },
  glowTeal: {
    position: 'absolute', width: 280, height: 280, borderRadius: 280,
    backgroundColor: '#2EC5B6', opacity: 0.06, top: -80, right: -60,
  },
  glowIndigo: {
    position: 'absolute', width: 240, height: 240, borderRadius: 240,
    backgroundColor: '#6C8BFF', opacity: 0.05, bottom: -80, left: -60,
  },
});
