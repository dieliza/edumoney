import { useIsFocused } from 'expo-router';
import { type ComponentProps, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../design/ThemeProvider';
import { ThemePicker } from './ThemePicker';
import { Brand } from './Brand';
export type IconName = ComponentProps<typeof Ionicons>['name'];
export function Body({ children, muted = false, style }: PropsWithChildren<{ muted?: boolean; style?: ComponentProps<typeof Text>['style'] }>) {
  const { colors } = useTheme();
  return <Text style={[{ color: muted ? colors.muted : colors.text, fontSize: 16, lineHeight: 24 }, style]}>{children}</Text>;
}
export function Card({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  const { colors } = useTheme();
  return <View style={[{ backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.line, gap: 14, boxShadow: '0px 5px 18px rgba(0, 26, 40, 0.06)' }, style]}>{children}</View>;
}
export function IconBadge({ icon, tone = 'mint', size = 48 }: { icon: IconName; tone?: 'mint' | 'blue' | 'coral' | 'violet'; size?: number }) {
  const { colors } = useTheme();
  const ink = { mint: '#006B50', blue: '#0066A5', coral: '#BB2638', violet: '#773DB1' }[tone];
  return <View style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: colors[tone], alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Ionicons name={icon} size={size * 0.52} color={ink} />
  </View>;
}
export function ActionButton({ title, onPress, icon, secondary = false, testID }: { title: string; onPress(): void; icon?: IconName; secondary?: boolean; testID?: string }) {
  const { colors } = useTheme();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} onPress={onPress}
    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, borderRadius: 18, overflow: 'hidden', minHeight: 54, borderWidth: secondary ? 1 : 0, borderColor: colors.primary })}>
    <LinearGradient colors={secondary ? [colors.surface, colors.surface] : ['#00805C', '#006248']} style={{ minHeight: 54, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
      {icon ? <Ionicons name={icon} color={secondary ? colors.primary : '#FFFFFF'} size={22} /> : null}
      <Text style={{ fontSize: 17, fontWeight: '700', color: secondary ? colors.primary : '#FFFFFF', flexShrink: 1, textAlign: 'center' }}>{title}</Text>
    </LinearGradient>
  </Pressable>;
}
export function SectionHeading({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const { name, colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
    <Text accessibilityRole="header" style={{ color: name === 'dark' ? '#F4FAFC' : colors.text, fontSize: 21, fontWeight: '700', flex: 1 }}>{title}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{action}</Text></Pressable> : null}
  </View>;
}
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return <View accessibilityRole="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: value }} style={{ height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.progressTrack }}>
    <LinearGradient colors={['#008464', '#2FBA91']} style={{ width: `${value}%`, height: 8, borderRadius: 8 }} />
  </View>;
}
export function Waves() {
  const { colors } = useTheme();
  return <View pointerEvents="none" importantForAccessibility="no-hide-descendants" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 210, opacity: 0.23 }}>
    <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
      <Path d="M0 90 Q75 20 180 105 T400 70 V200 H0 Z" fill={colors.wave} />
      <Path d="M0 145 Q110 70 230 145 T400 110 V200 H0 Z" fill="#39BFD0" />
      <Path d="M0 175 Q130 110 260 160 T400 130 V200 H0 Z" fill="#78D38A" />
    </Svg>
  </View>;
}
export function Screen({ children, title, subtitle, welcome = false }: PropsWithChildren<{ title: string; subtitle?: string; welcome?: boolean }>) {
  const { name, colors, notice } = useTheme();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  if (!focused) return null;
  const headerInk = name === 'dark' ? '#F4FAFC' : colors.text;
  return <LinearGradient testID={`theme-${name}`} colors={colors.gradient} style={{ flex: 1 }}>
    <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
    <Waves />
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{ width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: width < 370 ? 16 : 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 70, gap: 10 }}>
          {welcome ? <Brand onDark={name === 'dark'} /> : <Text accessibilityRole="header" style={{ fontSize: 27, fontWeight: '800', letterSpacing: -0.5, color: headerInk, flex: 1 }}>{title}</Text>}
          <ThemePicker color={headerInk} />
        </View>
      </View>
      <ScrollView tabIndex={0} accessibilityLabel={`Contenido de ${title}`} contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 700, alignSelf: 'center', paddingHorizontal: width < 370 ? 16 : 24, gap: 18 }}>
          {!welcome ? <View style={{ backgroundColor: colors.warning, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}><Text style={{ color: colors.warningText, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>DEMOSTRACIÓN · DATOS FICTICIOS</Text></View> : null}
          {subtitle ? <Text style={{ color: name === 'dark' ? '#D2E9EF' : colors.muted, fontSize: 16, lineHeight: 24 }}>{subtitle}</Text> : null}
          {notice ? <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors.warning, padding: 14, borderRadius: 12 }}><Text style={{ color: colors.warningText, fontSize: 15 }}>{notice}</Text></View> : null}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  </LinearGradient>;
}
export const ui = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, heading: { fontSize: 20, fontWeight: '700' }, small: { fontSize: 13, lineHeight: 20 } });
