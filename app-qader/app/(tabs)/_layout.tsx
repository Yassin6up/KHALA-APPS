import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Home, Sparkles, MessageCircle, BookOpen, User as UserIcon } from 'lucide-react-native';
import { colors, font } from '../../src/theme';

function TabIcon({ icon: Icon, focused }: { icon: any; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={20} color={focused ? colors.brand : colors.textLo} strokeWidth={focused ? 2.5 : 2} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textLo,
        tabBarStyle: styles.bar,
        tabBarLabelStyle: styles.label,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'الرئيسية', tabBarIcon: (p) => <TabIcon icon={Home} focused={p.focused} /> }}
      />
      <Tabs.Screen
        name="mentor"
        options={{ title: 'المرشد', tabBarIcon: (p) => <TabIcon icon={Sparkles} focused={p.focused} /> }}
      />
      <Tabs.Screen
        name="community"
        options={{ title: 'المجتمع', tabBarIcon: (p) => <TabIcon icon={MessageCircle} focused={p.focused} /> }}
      />
      <Tabs.Screen
        name="library"
        options={{ title: 'المكتبة', tabBarIcon: (p) => <TabIcon icon={BookOpen} focused={p.focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'حسابي', tabBarIcon: (p) => <TabIcon icon={UserIcon} focused={p.focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    height: 76,
    paddingTop: 6,
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 8,
  },
  label: { fontFamily: font.medium, fontSize: 11 },
  iconWrap: {
    width: 40, height: 32,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 16,
  },
  iconWrapActive: { backgroundColor: 'rgba(46,197,182,0.12)' },
});
