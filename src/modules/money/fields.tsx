import { isRequiredField, isCalculationField, missingField } from '../../ui/requiredFields';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, TextInput, View, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { useState, type PropsWithChildren } from 'react';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { Body, Card, CloseButton } from '../../ui/components';
export function Sheet({ title, close, children, busy = false }: PropsWithChildren<{
    title: string;
    close(): void;
    busy?: boolean;
}>) {
    const { colors } = useTheme();
    return <Modal transparent animationType="none" onRequestClose={() => { if (!busy)
        close(); }}><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: fixed.previewBackdrop }}>
  <View style={{ width: '100%', maxWidth: 650, maxHeight: '92%', alignSelf: 'center' }}><View style={{flexDirection:'row',gap:8,alignItems:'center',paddingBottom:8}}><Pressable testID="sheet-dismiss-keyboard" accessibilityRole="button" accessibilityLabel="Ocultar teclado del formulario" onPress={()=>Keyboard.dismiss()} style={{minWidth:48,minHeight:48,padding:12,backgroundColor:colors.surface,borderRadius:16}}><Ionicons name="keypad-outline" size={24} color={colors.primary}/></Pressable><View style={{flex:1}}/>{!busy?<CloseButton testID="sheet-close" onPress={close}/>:null}</View>
  <ScrollView tabIndex={0} keyboardDismissMode="on-drag" keyboardShouldPersistTaps="handled" style={{ flexShrink: 1, width: '100%', borderRadius: 24 }}><Card style={{ gap: 16 }}>
   <Body style={{ fontSize: 23, fontWeight: '800', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>{title}</Body>{children}
   {busy ? <Body>Guardando en este dispositivo…</Body> : null}
  </Card></ScrollView>
 </View></KeyboardAvoidingView></Modal>;
}
export function Field({ label, value, onChangeText, decimal = false, multiline = false, testID, maxLength, secure = false, required, calculationRequired = isCalculationField(label) }: {
    label: string;
    value: string;
    onChangeText(value: string): void;
    decimal?: boolean;
    multiline?: boolean;
    testID?: string;
    maxLength?: number;
    secure?: boolean;
    required?: boolean;
    calculationRequired?: boolean;
}) {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const needed = required ?? isRequiredField(label);
    const missing = missingField(value, needed || calculationRequired);
    return <View style={{ gap: 6, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}><Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body><TextInput secureTextEntry={secure && !visible} autoCorrect={secure ? false : undefined} autoCapitalize={secure ? 'none' : undefined} testID={testID} accessibilityLabel={label} accessibilityHint={missing ? (calculationRequired ? 'Necesario para calcular. Completa este dato.' : 'Campo obligatorio sin completar.') : undefined} aria-invalid={missing} value={value} onChangeText={onChangeText} keyboardType={decimal ? 'decimal-pad' : 'default'} multiline={multiline} maxLength={maxLength ?? (multiline ? 240 : 100)} style={{ minHeight: 50, borderWidth: missing ? 2 : 1, borderColor: missing ? fixed.expense : colors.line, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.surfaceAlt, fontSize: 17 }} placeholderTextColor={colors.muted}/>{secure ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onPress={() => setVisible(!visible)} style={{minHeight:44,justifyContent:"center",alignSelf:"flex-start",paddingHorizontal:12}}><Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={24} color={colors.primary}/></Pressable> : null}{missing ? <Body style={{fontSize:12,lineHeight:18,color:fixed.expense}}>{calculationRequired ? 'Necesario para calcular' : 'Obligatorio'}</Body> : null}</View>;
}
export function Choices<T extends string>({ label, value, options, onChange, presentation = 'select', required = false }: {
    label: string;
    value: T;
    options: readonly (readonly [
        T,
        string
    ])[];
    onChange(value: T): void;
    presentation?: 'select' | 'tabs';
    required?: boolean;
}) {
    const { colors } = useTheme();
    const [open, setOpen] = useState(false);
    const missing = missingField(value, required);
    const selected = options.find(([key]) => key === value)?.[1] ?? 'Seleccionar';
    if (presentation === 'select') return <View style={{ gap: 6, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}>
      <Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label}: ${selected}`} accessibilityHint={missing ? 'Selección obligatoria sin completar. Abre las opciones.' : 'Abre las opciones para elegir una'} aria-invalid={missing} accessibilityState={{ expanded: open }} onPress={() => setOpen(current => !current)} style={{ minHeight: 52, borderWidth: missing ? 2 : 1, borderColor: missing ? fixed.expense : colors.line, borderRadius: 12, backgroundColor: colors.surfaceAlt, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Body style={{ flex: 1 }}>{selected}</Body><Ionicons name="chevron-down" size={20} color={colors.primary}/>
      </Pressable>
      {missing ? <Body style={{fontSize:12,lineHeight:18,color:fixed.expense}}>Obligatorio</Body> : null}
      {open ? <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 8, gap: 8, backgroundColor: colors.surfaceAlt }}>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 280 }}>
          <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: 6 }}>
            {options.map(([key, text]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: value === key }} aria-checked={value === key} onPress={() => { onChange(key); setOpen(false); }} style={{ minHeight: 52, borderRadius: 12, backgroundColor: value === key ? colors.mint : colors.surface, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}><Body style={{ flex: 1 }}>{text}</Body>{value === key ? <Ionicons name="checkmark-circle" size={22} color={colors.primary}/> : null}</Pressable>)}
          </View>
        </ScrollView>
        <CloseButton label={`Cerrar opciones de ${label}`} onPress={() => setOpen(false)}/>
      </View> : null}
    </View>;
    return <View style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: colors.surface }}><Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{options.map(([key, text]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: value === key }} aria-checked={value === key} onPress={() => onChange(key)} style={{ minHeight: 48, padding: 12, borderWidth: 1, borderColor: value === key ? colors.primary : colors.line, borderRadius: 12, backgroundColor: value === key ? colors.primary : colors.surfaceAlt }}><Body style={{ fontSize: 14, color: value === key ? fixed.white : colors.text }}>{text}</Body></Pressable>)}</View></View>;
}
export function ErrorNotice({ message }: {
    message: string;
}) { return message ? <Card><View accessibilityRole="alert"><Body>{message}</Body></View></Card> : null; }
