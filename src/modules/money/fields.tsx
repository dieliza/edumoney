import {SelectControl} from '../../ui/SelectControl';
import { DateField } from '../../ui/DateField';
import { isCalendarField } from '../../ui/dateInput';
import { moneyKeystroke, moneyDisplay } from '../../ui/moneyInput';
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
export function Field({ label, value, onChangeText, decimal = false, multiline = false, testID, maxLength, secure = false, required, money, calculationRequired = isCalculationField(label), compact = false }: {
    label: string;
    value: string;
    onChangeText(value: string): void;
    decimal?: boolean;
    multiline?: boolean;
    testID?: string;
    maxLength?: number;
    secure?: boolean;
    money?: boolean;
    required?: boolean;
    calculationRequired?: boolean;
    compact?: boolean;
}) {
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const monetary = money ?? (decimal && !/%|APR|tasa|porcentaje/i.test(label));
    const descriptionField=/descripci[oó]n/i.test(label)&&!/^Buscar/i.test(label);
    const needed = descriptionField?false:required ?? isRequiredField(label);
    const missing = missingField(value, needed || calculationRequired);
    if(isCalendarField(label)&&!secure&&!multiline)return <DateField label={label} value={value} onChangeText={onChangeText} required={needed||calculationRequired} testID={testID}/>;
    return <View style={{ gap: 6, padding: compact ? 4 : 12, borderRadius: 16, backgroundColor: colors.surface }}><Body style={{ fontSize: 14, fontWeight: '600' }}>{label}{descriptionField&&!/opcional/i.test(label)?' (opcional)':''}</Body><TextInput secureTextEntry={secure && !visible} autoCorrect={secure ? false : undefined} autoCapitalize={secure ? 'none' : undefined} testID={testID} accessibilityLabel={label} accessibilityHint={missing ? (calculationRequired ? 'Necesario para calcular. Completa este dato.' : 'Campo obligatorio sin completar.') : undefined} aria-invalid={missing} placeholder={monetary?'0.00':undefined} value={monetary?moneyDisplay(value):value} onChangeText={monetary?text=>{if(text.replace(/\D/g,'').length<=15)onChangeText(moneyKeystroke(text));}:onChangeText} keyboardType={decimal ? 'decimal-pad' : 'default'} multiline={multiline} maxLength={maxLength ?? (multiline ? 240 : 100)} style={{ minHeight: 50, borderWidth: missing ? 2 : 1, borderColor: missing ? fixed.expense : colors.line, borderRadius: 12, padding: 12, color: colors.text, backgroundColor: colors.surfaceAlt, fontSize: 17 }} placeholderTextColor={colors.muted}/>{monetary&&!compact?<><Body muted style={{fontSize:12}}>Escribe los dígitos de derecha a izquierda: 100 → 1.00 USD.</Body><Pressable accessibilityRole="button" accessibilityLabel={`Limpiar ${label}`} onPress={()=>onChangeText('')} style={{minHeight:44,justifyContent:"center"}}><Body>Limpiar importe</Body></Pressable></>:null}{secure ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onPress={() => setVisible(!visible)} style={{minHeight:44,justifyContent:"center",alignSelf:"flex-start",paddingHorizontal:12}}><Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={24} color={colors.primary}/></Pressable> : null}{missing ? <Body style={{fontSize:12,lineHeight:18,color:fixed.expense}}>{calculationRequired ? 'Necesario para calcular' : 'Obligatorio'}</Body> : null}</View>;
}
export function Choices<T extends string>({ label, value, options, onChange, presentation = 'select', required = false, compact = false }: {
    label: string;
    value: T;
    options: readonly (readonly [
        T,
        string
    ])[];
    onChange(value: T): void;
    presentation?: 'select' | 'tabs';
    compact?: boolean;
    required?: boolean;
}) {
    const { colors } = useTheme();
    if (presentation === 'select') return <SelectControl label={label} value={value} options={options} onChange={onChange} required={required} compact={compact}/>;
    return <View style={{ gap: compact ? 0 : 8, padding: compact ? 4 : 12, borderRadius: 16, backgroundColor: colors.surface }}>{!compact?<Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body>:null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:compact?4:8,flexGrow:1}}><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: compact?4:8,flex:1 }}>{options.map(([key, text]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: value === key }} aria-checked={value === key} onPress={() => onChange(key)} style={{ flex:compact?1:undefined,alignItems:'center',justifyContent:'center',minHeight: 44, padding: compact?8:12, borderWidth: 1, borderColor: value === key ? colors.primary : colors.line, borderRadius: 12, backgroundColor: value === key ? colors.primary : colors.surfaceAlt }}><Body style={{ fontSize: 14, color: value === key ? fixed.white : colors.text }}>{text}</Body></Pressable>)}</View></ScrollView></View>;
}
export function ErrorNotice({ message }: {
    message: string;
}) { return message ? <Card><View accessibilityRole="alert"><Body>{message}</Body></View></Card> : null; }
