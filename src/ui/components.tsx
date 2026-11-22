import {installButtonFinish} from './buttonFinish';
import {beginSaveAction,getSaveNotice,serverSaveNotice,subscribeSaveNotice} from './saveFeedback';
import {ChartSurface} from './ChartSurface';
import {RecordSurface} from './RecordSurface';
import { fixed } from '../design/tokens';
import { useIsFocused, router } from 'expo-router';
import {useState,useSyncExternalStore, type ComponentProps, type PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, KeyboardAvoidingView, Keyboard, Platform, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../design/ThemeProvider';
import {HeaderActions} from './HeaderActions';
import { Brand } from './Brand';
export {CloseButton} from './CloseButton';
export type IconName = ComponentProps<typeof Ionicons>['name'];
installButtonFinish();
export function Body({ children, muted = false, style, canvas = false,numberOfLines,adjustsFontSizeToFit,minimumFontScale }: PropsWithChildren<{ muted?: boolean; canvas?:boolean;numberOfLines?:number;adjustsFontSizeToFit?:boolean;minimumFontScale?:number; style?: ComponentProps<typeof Text>['style'] }>) {
  const { colors } = useTheme();
  return <Text numberOfLines={numberOfLines} adjustsFontSizeToFit={adjustsFontSizeToFit} minimumFontScale={minimumFontScale} style={[{ color: canvas ? (muted?'#D7F2EE':'#F4FFFC') : muted ? colors.muted : colors.text, fontSize: 16, lineHeight: 24,flexShrink:1,maxWidth:'100%' }, style]}>{children}</Text>;
}
export function Card({ children, style, chart = false, row = false }: PropsWithChildren<{ style?: StyleProp<ViewStyle>;chart?:boolean;row?:boolean }>) {
  const { colors } = useTheme();
  if(row)return <RecordSurface style={style}>{children}</RecordSurface>;
  if(chart)return <ChartSurface style={style}>{children}</ChartSurface>;
  return <View style={[{ backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.line, gap: 10, boxShadow: '0px 5px 18px rgba(0, 26, 40, 0.06)' }, style]}>{children}</View>;
}
export function IconBadge({ icon, tone = 'mint', size = 48, iconColor }: { icon: IconName; tone?: 'mint' | 'blue' | 'coral' | 'violet'; size?: number;iconColor?:string }) {
  const { colors } = useTheme();
  const ink = { mint: fixed.iconMint, blue: fixed.iconBlue, coral: fixed.iconCoral, violet: fixed.iconViolet }[tone];
  return <View accessible={false} aria-hidden importantForAccessibility="no-hide-descendants" style={{ width: size, height: size, borderRadius: size / 3, backgroundColor: colors[tone], alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
    <Ionicons name={icon} size={size * 0.52} color={iconColor??ink} />
  </View>;
}
/** Acceso del panel: el mismo control visual para registros reales y demostraciones. */
export function DashboardAction({ title, icon, tone = 'mint', onPress, testID, accessibilityLabel, compact = false, canvas = false, iconColor }: { title: string; accessibilityLabel?: string; compact?: boolean;canvas?:boolean;iconColor?:string; icon: IconName; tone?: 'mint' | 'blue' | 'coral' | 'violet'; onPress(): void; testID?: string }) {
  const { colors } = useTheme();
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? title} onPress={onPress} style={({ pressed }) => ({ flexBasis: compact ? '22%' : '46%', flexGrow: 1, flexShrink: 1, minWidth: compact ? 58 : undefined, minHeight: compact ? 86 : 110, padding: compact ? 7 : 16, gap: compact ? 3 : 8, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors[tone], opacity: pressed ? 0.7 : 1 })}>
    <IconBadge icon={icon} tone={tone} iconColor={iconColor} size={compact ? 36 : 42}/><Body canvas={canvas} style={{ fontSize: compact ? 12 : 14, fontWeight: '700', textAlign: 'center' }}>{title}</Body>
  </Pressable>;
}
export function ActionButton({ title, onPress, icon, secondary = false, testID }: { title: string; onPress(): void; icon?: IconName; secondary?: boolean; testID?: string }) {
  const { colors } = useTheme();const [ticket,setTicket]=useState<number|null>(null);const notice=useSyncExternalStore(subscribeSaveNotice,getSaveNotice,serverSaveNotice);const succeeded=ticket!==null&&notice?.ticket===ticket;
  return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={succeeded?'Guardado exitosamente':title} onPress={()=>{setTicket(beginSaveAction(title));onPress();}}
    style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, borderRadius: 12, overflow: 'hidden', minHeight: 54, borderWidth: secondary ? 1 : 0, borderColor: colors.primary })}>
    <LinearGradient colors={secondary ? [colors.surface, colors.surface] : [fixed.buttonStart, fixed.buttonEnd]} style={{ minHeight: 54, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
      {icon ? <Ionicons name={icon} color={secondary ? colors.primary : fixed.white} size={22} /> : null}
      <Text style={{ fontSize: 17, fontWeight: '700', color: secondary ? colors.primary : fixed.white, flexShrink: 1, textAlign: 'center' }}>{succeeded?'Guardado exitosamente':title}</Text>
    </LinearGradient>
  </Pressable>;
}
export function SectionHeading({ title, action, onPress, onSurface = false }: { title: string; action?: string; onPress?: () => void; onSurface?: boolean }) {
  const { name, colors } = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 }}>
    <Text accessibilityRole="header" style={{ color: name === 'dark' && !onSurface ? fixed.headingDark : colors.text, fontSize: 21, fontWeight: '700', flex: 1 }}>{title}</Text>
    {action && onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={{ paddingVertical: 12, minHeight: 48, justifyContent: 'center' }}><Text style={{ color: colors.accent, fontSize: 14, fontWeight: '700' }}>{action}</Text></Pressable> : null}
  </View>;
}
export function ProgressBar({ value, label }: { value: number; label: string }) {
  const { colors } = useTheme();
  return <View accessibilityRole="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} accessibilityLabel={label} accessibilityValue={{ min: 0, max: 100, now: value }} style={{ height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.progressTrack }}>
    <LinearGradient colors={[fixed.progressStart, fixed.progressEnd]} style={{ width: `${value}%`, height: 8, borderRadius: 8 }} />
  </View>;
}
export function Waves() {
  const { colors } = useTheme();
  return <View pointerEvents="none" importantForAccessibility="no-hide-descendants" aria-hidden style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 210, opacity: 0.23 }}>
    <Svg width="100%" height="100%" viewBox="0 0 400 200" preserveAspectRatio="none">
      <Path d="M0 90 Q75 20 180 105 T400 70 V200 H0 Z" fill={colors.wave} />
      <Path d="M0 145 Q110 70 230 145 T400 110 V200 H0 Z" fill={fixed.waveBlue} />
      <Path d="M0 175 Q130 110 260 160 T400 130 V200 H0 Z" fill={fixed.waveGreen} />
    </Svg>
  </View>;
}
export function Screen({ children, title, subtitle, welcome = false, demo = true, keyboardForm = false, back = !welcome, beforeBack, dashboard = false,chartMonth }: PropsWithChildren<{ title: string; subtitle?: string; dashboard?: boolean; chartMonth?: string; welcome?: boolean; demo?: boolean; keyboardForm?: boolean; back?: boolean; beforeBack?:()=>void }>) {
  const { name, colors, notice } = useTheme();
  const { width } = useWindowDimensions();
  const focused = useIsFocused();
  if (!focused) return null;
  const headerInk = name === 'dark' ? fixed.headingDark : colors.text;
  return <LinearGradient testID={`theme-${name}`} colors={colors.gradient} style={{ flex: 1 }}>
    <StatusBar style={name === 'dark' ? 'light' : 'dark'} />
    <Waves />
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      <View style={{width:'100%',position:'relative'}}>
      {back&&!dashboard?<View style={{position:'absolute',left:width>1040?(width-1040)/2+8:8,top:8,zIndex:2}}><ArrowBack beforeBack={beforeBack} color={headerInk} fallback={title==='Mi dinero'?'/':'/money'}/></View>:null}
      <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center', paddingLeft: back&&!dashboard?64:16,paddingRight:16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, gap: 6 }}>
          {dashboard?<><View style={{width:width<400?36:48}}><Brand size={width<400?36:48} onDark={name==='dark'}/></View><View style={{flex:1}}><Text accessibilityRole="header" style={{fontSize:width<370?18:23,fontStyle:'italic',fontWeight:'800',letterSpacing:-.6,color:headerInk}}>EduMoney</Text><Text style={{fontSize:width<400?7:10,letterSpacing:width<400?0.4:1,color:headerInk}}>FINANZAS PERSONALES</Text></View></>:<>{welcome?<Brand onDark={name==='dark'}/>:<Text accessibilityRole="header" style={{fontSize:23,fontWeight:'800',letterSpacing:-.5,color:headerInk,flex:1}}>{title}</Text>}</>}
          {width>=600?<HeaderActions color={headerInk} month={chartMonth}/>:null}
        </View>
        {width<600?<View style={{marginLeft:back&&!dashboard?-48:0,paddingBottom:6}}><HeaderActions expanded color={headerInk} month={chartMonth}/></View>:null}
        {keyboardForm?<Pressable testID="form-dismiss-keyboard" accessibilityRole="button" accessibilityLabel="Ocultar teclado" onPress={()=>Keyboard.dismiss()} style={{minHeight:48,justifyContent:'center',alignItems:'flex-end',paddingVertical:8}}><Text style={{color:headerInk,fontSize:16,fontWeight:'600'}}>Ocultar teclado</Text></Pressable>:null}
      </View></View>
      <KeyboardAvoidingView enabled={keyboardForm} behavior={Platform.OS==='ios'?'padding':'height'} style={{flex:1}}><ScrollView keyboardDismissMode="on-drag" tabIndex={0} accessibilityLabel={`Contenido de ${title}`} contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View style={{ width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: width < 370 ? 12 : 16, gap: 12 }}>
          {!welcome && demo ? <View style={{ backgroundColor: colors.warning, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }}><Text style={{ color: colors.warningText, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>DEMOSTRACIÓN · DATOS FICTICIOS</Text></View> : null}
          {subtitle ? <Text style={{ color: name === 'dark' ? fixed.subtitleDark : colors.muted, fontSize: 16, lineHeight: 24 }}>{subtitle}</Text> : null}
          {notice ? <View accessibilityLiveRegion="polite" style={{ backgroundColor: colors.warning, padding: 14, borderRadius: 12 }}><Text style={{ color: colors.warningText, fontSize: 15 }}>{notice}</Text></View> : null}
          {children}
        </View>
      </ScrollView></KeyboardAvoidingView>
    </SafeAreaView>
  </LinearGradient>;
}
export const ui = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }, heading: { fontSize: 20, fontWeight: '700' }, small: { fontSize: 13, lineHeight: 20 } });

function ArrowBack({beforeBack,color,fallback='/money'}:{beforeBack?:()=>void;color?:string;fallback?:'/'|'/money'}){
  const {colors}=useTheme();
  return <Pressable testID="header-back" accessibilityRole="button" accessibilityLabel="Volver a la pantalla anterior" onPress={()=>{beforeBack?.();if(router.canGoBack())router.back();else router.replace(fallback);}} style={{width:48,minHeight:48,alignItems:'center',justifyContent:'center',flexShrink:0}}><Ionicons name="arrow-back" size={28} color={color??colors.primary}/></Pressable>;
}
export function BackButton({beforeBack}: {beforeBack?:()=>void}) {
  return <ArrowBack beforeBack={beforeBack}/>;
}
