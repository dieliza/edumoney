import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../design/ThemeProvider';
import { fixed, type ThemePreference } from '../design/tokens';
const choices: { value: ThemePreference; label: string; icon: 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline'; detail: string }[] = [
  { value: 'light', label: 'Claro', icon: 'sunny-outline', detail: 'Blancos suaves, menta y azul claro' },
  { value: 'dark', label: 'Oscuro', icon: 'moon-outline', detail: 'Azul profundo, esmeralda y turquesa' },
  { value: 'automatic', label: 'Automático', icon: 'phone-portrait-outline', detail: 'Sigue la apariencia de tu dispositivo' },
];
export function ThemePicker({ color }: { color: string }) {
  const { name, preference, colors, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  return <>
    <Pressable testID="theme-picker-open" accessibilityRole="button" accessibilityLabel="Cambiar tema" accessibilityHint="Elegir Claro, Oscuro o Automático"
      onPress={() => setOpen(true)} style={({ pressed }) => ({ padding: 12, minWidth: 48, minHeight: 48, borderRadius: 24, opacity: pressed ? 0.65 : 1 })}>
      <Ionicons name={name === 'dark' ? 'moon-outline' : 'sunny-outline'} size={25} color={color} />
    </Pressable>
    <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
      <View style={{ flex: 1, backgroundColor: fixed.themeBackdrop, justifyContent: 'center', padding: 22 }}>
        <ScrollView tabIndex={0} style={{ maxHeight: '90%', width: '100%', maxWidth: 480, alignSelf: 'center', borderRadius: 28 }}>
        <View accessibilityViewIsModal style={{ backgroundColor: colors.surface, borderRadius: 28, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <Text accessibilityRole="header" style={{ fontSize: 24, fontWeight: '700', color: colors.text, flexShrink: 1 }}>Apariencia</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar selector de tema" onPress={() => setOpen(false)} style={{ padding: 12, minWidth: 48, minHeight: 48 }}>
              <Ionicons name="close" size={26} color={colors.text} />
            </Pressable>
          </View>
          <Text style={{ color: colors.muted, fontSize: 15 }}>Elige cómo quieres ver EduMoney.</Text>
          {choices.map(choice => <Pressable key={choice.value} testID={`theme-choice-${choice.value}`} accessibilityRole="radio" aria-checked={preference === choice.value} accessibilityState={{ checked: preference === choice.value }}
            accessibilityLabel={choice.label} accessibilityHint={choice.detail} onPress={() => { setPreference(choice.value); setOpen(false); }}
            style={({ pressed }) => ({ padding: 16, minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 2, borderColor: preference === choice.value ? colors.primary : colors.line, backgroundColor: pressed ? colors.mint : colors.surfaceAlt, borderRadius: 18 })}>
            <Ionicons name={choice.icon} size={25} color={colors.primary} />
            <View style={{ flex: 1, gap: 4 }}><Text style={{ color: colors.text, fontWeight: '700', fontSize: 18 }}>{choice.label}</Text>
              <Text style={{ color: colors.muted, fontSize: 14 }}>{choice.detail}</Text></View>
            {preference === choice.value ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} /> : null}
          </Pressable>)}
        </View>
        </ScrollView>
      </View>
    </Modal>
  </>;
}
