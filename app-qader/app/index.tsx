import { LinearGradient } from 'expo-linear-gradient';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { authStore } from '../src/lib/authStore';
import { colors, font, gradients } from '../src/theme';

/** Splash → onboarding. (Later: check stored session and route to tabs.) */
export default function Splash() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setDone(true), 1100);
    return () => clearTimeout(t);
  }, []);

  if (done) {
    if (authStore.isLoggedIn()) {
      return <Redirect href="/(tabs)/community" />;
    }
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={styles.root}>
      <LinearGradient colors={gradients.app} style={StyleSheet.absoluteFill} />
      <View style={styles.logoWrap}>
        <LinearGradient colors={gradients.brand} style={styles.logo}>
          <Text style={styles.logoMark}>ق</Text>
        </LinearGradient>
        <Text style={styles.title}>قادر</Text>
        <Text style={styles.subtitle}>اكتشف قدراتك. طوّر نفسك.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center', gap: 14 },
  logo: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  logoMark: { fontFamily: font.bold, fontSize: 52, color: '#06121f' },
  title: { fontFamily: font.bold, fontSize: 36, color: colors.textHi },
  subtitle: { fontFamily: font.regular, fontSize: 15, color: colors.textLo },
});
