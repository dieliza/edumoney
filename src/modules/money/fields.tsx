import {transactionFormColors as tc} from '../../ui/transactionFormStyle';
import { useSheetViewport } from '../../ui/useSheetViewport';
import {SaveToast} from '../../ui/SaveToast';
import {SelectControl} from '../../ui/SelectControl';
import { DateField } from '../../ui/DateField';
import { isCalendarField } from '../../ui/dateInput';
import { moneyKeystroke, moneyDisplay } from '../../ui/moneyInput';
import { isRequiredField, isCalculationField, missingField } from '../../ui/requiredFields';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, ScrollView, TextInput, View, KeyboardAvoidingView, Keyboard, Platform } from 'react-native';
import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { useTheme } from '../../design/ThemeProvider';
import { fixed } from '../../design/tokens';
import { Body, Card, CloseButton } from '../../ui/components';
export function Sheet({ title, close, children, headerAction, busy = false }: PropsWithChildren<{
    title: string;
    close(): void;
    busy?: boolean;
    headerAction?:ReactNode;
}>) {
    const { colors } = useTheme();
    const viewport = useSheetViewport();
    return <Modal transparent animationType="none" onRequestClose={() => { if (!busy)
        close(); }}><KeyboardAvoidingView enabled={Platform.OS !== 'web'} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: fixed.previewBackdrop }, Platform.OS === 'web' && viewport ? { position: 'absolute', top: viewport.top, height: viewport.height, left: 0, right: 0, flex: undefined } : undefined]}>
  <View style={{ width: '100%', maxWidth: 650, maxHeight: Platform.OS === 'web' ? '100%' : '92%', height: Platform.OS === 'web' ? '100%' : undefined, minHeight: 0, alignSelf: 'center' }}><View style={{flexDirection:'row',gap:8,alignItems:'center',paddingBottom:8}}><Pressable testID="sheet-dismiss-keyboard" accessibilityRole="button" accessibilityLabel="Ocultar teclado del formulario" onPress={()=>Keyboard.dismiss()} style={{minWidth:48,minHeight:48,padding:12,backgroundColor:colors.surface,borderRadius:16}}><Ionicons name="keypad-outline" size={24} color={colors.primary}/></Pressable><View style={{flex:1}}/>{!busy?<CloseButton testID="sheet-close" onPress={close}/>:null}</View>
  {headerAction?<View style={{padding:8,borderTopLeftRadius:20,borderTopRightRadius:20,backgroundColor:colors.surface}}>{headerAction}</View>:null}
  <ScrollView testID="sheet-scroll" tabIndex={0} keyboardDismissMode={Platform.OS === 'web' ? 'none' : 'on-drag'} keyboardShouldPersistTaps="handled" style={{ flexShrink: 1, flex: Platform.OS === 'web' ? 1 : undefined, minHeight: 0, width: '100%', borderRadius: 24 }}><Card style={{ gap: 10, padding: 12 }}>
   <Body style={{ fontSize: 23, fontWeight: '800', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>{title}</Body>{children}
   {busy ? <Body>Guardando en este dispositivo…</Body> : null}
  </Card></ScrollView>
 </View><SaveToast inSheet/></KeyboardAvoidingView></Modal>;
}
export function Field({ label, value, onChangeText, decimal = false, multiline = false, testID, maxLength, secure = false, required, money, calculationRequired = isCalculationField(label), compact = false,presentation }: {
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
    presentation?:'transaction';
}) {
    const { colors } = useTheme(),transaction=presentation==='transaction';
    const [visible, setVisible] = useState(false);
    const monetary = money ?? (decimal && !/%|APR|tasa|porcentaje/i.test(label));
    const descriptionField=/descripci[oó]n/i.test(label)&&!/^Buscar/i.test(label);
    const needed = descriptionField?false:required ?? isRequiredField(label);
    const missing = missingField(value, needed || calculationRequired);
    if(isCalendarField(label)&&!secure&&!multiline)return <DateField label={label} value={value} onChangeText={onChangeText} required={needed||calculationRequired} testID={testID} presentation={presentation}/>;
    return <View style={{ gap: transaction?8:6, padding: transaction?0:compact?4:12, borderRadius: 16, backgroundColor: transaction?'transparent':colors.surface }}><Body style={{ fontSize:transaction?16:14,fontWeight:transaction?'500':'600',color:transaction?tc.muted:colors.text }}>{label}{descriptionField&&!/opcional/i.test(label)?' (opcional)':''}</Body><TextInput secureTextEntry={secure && !visible} autoCorrect={secure ? false : undefined} autoCapitalize={secure ? 'none' : undefined} testID={testID} accessibilityLabel={label} accessibilityHint={missing ? (calculationRequired ? 'Necesario para calcular. Completa este dato.' : 'Campo obligatorio sin completar.') : undefined} aria-invalid={missing} placeholder={monetary?'0.00':undefined} value={monetary?moneyDisplay(value):value} onChangeText={monetary?text=>{if(text.replace(/\D/g,'').length<=15)onChangeText(moneyKeystroke(text));}:onChangeText} keyboardType={decimal ? 'decimal-pad' : 'default'} multiline={multiline} maxLength={maxLength ?? (multiline ? 240 : 100)} style={{ minHeight:transaction?48:compact?44:50, borderWidth: missing ? 2 : 1, borderColor: missing ? fixed.expense : colors.line, borderRadius: 12, padding: 12, color:transaction?tc.fieldInk:colors.text, backgroundColor:transaction?tc.field:colors.surfaceAlt,fontSize:transaction?16:17 }} placeholderTextColor={colors.muted}/>{monetary&&!compact?<><Body muted style={{fontSize:12}}>Escribe los dígitos de derecha a izquierda: 100 → 1.00 USD.</Body><Pressable accessibilityRole="button" accessibilityLabel={`Limpiar ${label}`} onPress={()=>onChangeText('')} style={{minHeight:44,justifyContent:"center"}}><Body>Limpiar importe</Body></Pressable></>:null}{secure ? <Pressable accessibilityRole="button" accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"} onPress={() => setVisible(!visible)} style={{minHeight:44,justifyContent:"center",alignSelf:"flex-start",paddingHorizontal:12}}><Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={24} color={colors.primary}/></Pressable> : null}{missing ? <Body style={{fontSize:12,lineHeight:18,color:transaction?tc.error:fixed.expense}}>{calculationRequired ? 'Necesario para calcular' : 'Obligatorio'}</Body> : null}</View>;
}
export function Choices<T extends string>({ label, value, options, onChange, presentation = 'select', required = false, compact = false,small=false,tabColors,tabSize,controlPresentation }: {
    label: string;
    value: T;
    options: readonly (readonly [
        T,
        string
    ])[];
    onChange(value: T): void;
    presentation?: 'select' | 'tabs';
    small?:boolean;
    tabColors?:Partial<Record<T,string>>;
    tabSize?:{width:number;height:number};
    controlPresentation?:'transaction';
    compact?: boolean;
    required?: boolean;
}) {
    const { colors } = useTheme();
    if (presentation === 'select') return <SelectControl label={label} value={value} options={options} onChange={onChange} required={required} compact={compact} presentation={controlPresentation}/>;
    return <View style={{ gap: compact ? 0 : 8, padding: compact ? 4 : 12, borderRadius: 16, backgroundColor: small?'transparent':colors.surface,alignSelf:small?'flex-start':undefined,maxWidth:tabSize?undefined:small?420:undefined,width:small?'100%':undefined }}>{!compact?<Body style={{ fontSize: 14, fontWeight: '600' }}>{label}</Body>:null}<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:compact?4:8,flexGrow:tabSize?0:1}}><View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ flexDirection: 'row', gap: compact?4:8,flex:tabSize?undefined:1 }}>{options.map(([key, text]) => <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{ checked: value === key }} aria-checked={value === key} onPress={() => onChange(key)} style={{ flex:tabSize?undefined:compact?1:undefined,width:tabSize?.width,height:tabSize?.height,flexShrink:tabSize?0:undefined,alignItems:'center',justifyContent:'center',minHeight: 44, padding: small?5:compact?8:12, borderWidth:tabColors?.[key]&&value===key?3:1,borderColor:tabColors?.[key]?(value===key?'#FFFFFF':tabColors[key]):(value === key ? colors.primary : colors.line), borderRadius: 12, backgroundColor: tabColors?.[key]??(value === key ? colors.primary : colors.surfaceAlt),opacity:1 }}><Body style={{ fontSize: tabSize?14:small?12:14, color: tabColors?.[key]||value === key ? fixed.white : colors.text,fontWeight:tabSize?'800':tabColors?.[key]?'700':undefined }}>{text}</Body></Pressable>)}</View></ScrollView></View>;
}
export function ErrorNotice({ message }: {
    message: string;
}) { return message ? <Card><View accessibilityRole="alert"><Body>{message}</Body></View></Card> : null; }
