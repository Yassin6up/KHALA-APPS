import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gift } from 'lucide-react-native';
import { authStore } from '../src/lib/authStore';
import { colors, font, gradients } from '../src/theme';

/** Splash → onboarding / tabs. */
export default function Splash() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  if (done) {
    return <Redirect href={authStore.isLoggedIn() ? '/(tabs)' : '/onboarding'} />;
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.app} style={StyleSheet.absoluteFill} />
      <View style={styles.logoWrap}>
        <LinearGradient colors={gradients.brand} style={styles.logo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Gift size={46} color="#fff" strokeWidth={2.4} />
        </LinearGradient>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.title}>فرح</Text>
          <Text style={styles.ai}>AI</Text>
        </View>
        <Text style={styles.subtitle}>كل مناسبة.. تجربة لا تُنسى</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', gap: 14 },
  logo: { width: 100, height: 100, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: font.bold, fontSize: 40, color: colors.textHi },
  ai: { fontFamily: font.bold, fontSize: 26, color: colors.gold },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textMid },
});
