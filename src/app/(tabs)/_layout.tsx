import { fixed } from '../../design/tokens';
import { Tabs } from 'expo-router';
import { Text, useWindowDimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../design/ThemeProvider';
import type { IconName } from '../../ui/components';
const tabs: { name: string; label: string; icon: IconName }[] = [
  { name: 'money', label: 'Mi dinero', icon: 'wallet-outline' },
  { name: 'goals', label: 'Mis metas', icon: 'flag-outline' },
  { name: 'learn', label: 'Aprende', icon: 'book-outline' },
  { name: 'progress', label: 'Mi progreso', icon: 'stats-chart-outline' },
  { name: 'business', label: 'Negocio', icon: 'briefcase-outline' },
];
export default function TabLayout() {
  const { colors, name } = useTheme();
  const { fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, animation: 'none', tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: name === 'dark' ? fixed.tabMutedDark : fixed.tabMutedLight,
    tabBarStyle: { backgroundColor: colors.tab, borderTopColor: name === 'dark' ? fixed.tabBorderDark : colors.line, height: 74 + insets.bottom + Math.max(0, fontScale - 1) * 42, paddingTop: 9, paddingBottom: Math.max(10, insets.bottom) },
    tabBarItemStyle: { minHeight: 52 }, tabBarHideOnKeyboard: true }}>
    {tabs.map(tab => <Tabs.Screen key={tab.name} name={tab.name} options={{ title: tab.label, tabBarAccessibilityLabel: tab.label,
      tabBarIcon: ({ color }) => <Ionicons name={tab.icon} color={typeof color === 'string' ? color : colors.primary} size={24} />,
      tabBarLabel: ({ color }) => <Text style={{ color, fontSize: 11, fontWeight: '600', textAlign: 'center', flexShrink: 1 }}>{tab.label}</Text>,
    }} />)}
  </Tabs>;
}
