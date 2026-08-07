import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Home, LayoutGrid, Store, Users, User as UserIcon } from 'lucide-react-native';
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
      <Tabs.Screen name="index" options={{ title: 'الرئيسية', tabBarIcon: (p) => <TabIcon icon={Home} focused={p.focused} /> }} />
      <Tabs.Screen name="occasions" options={{ title: 'المناسبات', tabBarIcon: (p) => <TabIcon icon={LayoutGrid} focused={p.focused} /> }} />
      <Tabs.Screen name="marketplace" options={{ title: 'السوق', tabBarIcon: (p) => <TabIcon icon={Store} focused={p.focused} /> }} />
      <Tabs.Screen name="community" options={{ title: 'المجتمع', tabBarIcon: (p) => <TabIcon icon={Users} focused={p.focused} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'حسابي', tabBarIcon: (p) => <TabIcon icon={UserIcon} focused={p.focused} /> }} />
      <Tabs.Screen name="mentor" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(42,19,48,0.07)',
    height: 76,
    paddingTop: 6,
    shadowColor: '#7A1F4F',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  label: { fontFamily: font.medium, fontSize: 11 },
  iconWrap: { width: 40, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16 },
  iconWrapActive: { backgroundColor: 'rgba(232,72,139,0.12)' },
});
