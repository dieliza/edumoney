import { Modal, Pressable, ScrollView, TextInput, View, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import type { PropsWithChildren } from 'react';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { ActionButton, Body, Card } from '../../ui/components';
export function Sheet({ title, close, children, busy = false }: PropsWithChildren<{
    title: string;
    close(): void;
    busy?: boolean;
}>) {
    return <Modal transparent animationType="none" onRequestClose={() => { if (!busy)
        close(); }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: fixed.previewBackdrop }}>
  <View style={{ width: '100%', maxWidth: 650, maxHeight: '92%', alignSelf: 'center' }}><ActionButton title="Ocultar teclado del formulario" testID="sheet-dismiss-keyboard" secondary onPress={()=>Keyboard.dismiss()}/>
  <ScrollView tabIndex={0} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" style={{ flexShrink: 1, width: '100%', borderRadius: 24 }}><Card>
   <Body style={{ fontSize: 23, fontWeight: '700' }}>{title}</Body>{children}
   {!busy ? <ActionButton title="Cerrar ficha" secondary onPress={close}/> : <Body>Guardando en este dispositivo…</Body>}
  </Card></ScrollView>
 </View></KeyboardAvoidingView></Modal>;
}
export function Field({ label, value, onChangeText, decimal = false, multiline = false, testID, maxLength, secure = false }: {
    label: string;
    value: string;
    onChangeText(value: string): void;
    decimal?: boolean;
    multiline?: boolean;
    testID?: string;
    maxLength?: number;
    secure?: boolean;
}) {
    const { colors } = useTheme();
    return <View style={{ gap: 6, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}><Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body><TextInput secureTextEntry={secure} autoCorrect={secure ? false : undefined} autoCapitalize={secure ? 'none' : undefined} testID={testID} accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType={decimal ? 'decimal-pad' : 'default'} multiline={multiline} maxLength={maxLength ?? (multiline ? 240 : 100)} style={{ minHeight: 50, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.surface, fontSize: 17 }} placeholderTextColor={colors.muted}/></View>;
}
export function Choices<T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: readonly (readonly [
        T,
        string
    ])[];
    onChange(value: T): void;
}) {
    const { colors } = useTheme();
    return <View style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}><Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options.map(([key, text]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: value === key }} aria-checked={value === key} onPress={() => onChange(key)} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: colors.muted, borderRadius: 12, backgroundColor: value === key ? colors.primary : colors.surface }}><Body style={{ fontSize: 14, color: value === key ? fixed.white : colors.text }}>{text}</Body></Pressable>)}</View></View>;
}
export function ErrorNotice({ message }: {
    message: string;
}) { return message ? <Card><View accessibilityRole="alert"><Body>{message}</Body></View></Card> : null; }
