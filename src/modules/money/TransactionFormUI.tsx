import {useState,useSyncExternalStore,type PropsWithChildren} from 'react';
import {ActivityIndicator,Keyboard,KeyboardAvoidingView,Modal,Platform,Pressable,ScrollView,StyleSheet,Text,View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useSheetViewport} from '../../ui/useSheetViewport';
import {SaveToast} from '../../ui/SaveToast';
import {beginSaveAction,getSaveNotice,serverSaveNotice,subscribeSaveNotice} from '../../ui/saveFeedback';
import {transactionFormColors as c} from '../../ui/transactionFormStyle';
import {TransactionFormWebStyles} from './TransactionFormWebStyles';

export function TransactionSheet({title,close,busy,children}:PropsWithChildren<{title:string;close():void;busy:boolean}>){
 const viewport=useSheetViewport(),insets=useSafeAreaInsets();
 return <Modal transparent animationType="none" onRequestClose={()=>{if(!busy)close();}}><KeyboardAvoidingView enabled={Platform.OS!=='web'} behavior={Platform.OS==='ios'?'padding':'height'} style={[styles.backdrop,{paddingTop:Math.max(8,insets.top),paddingBottom:Math.max(8,insets.bottom)},Platform.OS==='web'&&viewport?{position:'absolute',top:viewport.top,height:viewport.height,left:0,right:0,flex:undefined}:undefined]}>
  <View testID="transaction-sheet" accessibilityViewIsModal style={styles.sheet}>
   <TransactionFormWebStyles/>
   <View style={styles.header}><Text accessibilityRole="header" style={styles.title}>{title}</Text><Pressable testID="sheet-dismiss-keyboard" accessibilityRole="button" accessibilityLabel="Ocultar teclado del formulario" onPress={()=>Keyboard.dismiss()} style={styles.headerButton}><Text accessible={false} style={styles.keyboardIcon}>⌨</Text></Pressable><Pressable testID="sheet-close" accessibilityRole="button" accessibilityLabel="Cerrar nueva transacción" accessibilityState={{disabled:busy}} disabled={busy} onPress={close} style={styles.headerButton}><Text accessible={false} style={styles.closeIcon}>×</Text></Pressable></View>
   <ScrollView testID="sheet-scroll" keyboardDismissMode={Platform.OS==='web'?'none':'on-drag'} keyboardShouldPersistTaps="handled" style={styles.scroll} contentContainerStyle={styles.content}>{children}</ScrollView>
   <SaveToast inSheet/>
  </View>
 </KeyboardAvoidingView></Modal>;
}
export function TransactionSegments<T extends string>({label,value,options,onChange,compact=false,disabled=false}:{label:string;value:T;options:readonly(readonly[T,string])[];onChange(value:T):void;compact?:boolean;disabled?:boolean}){
 return <View style={compact?styles.scope:styles.types} accessibilityRole="radiogroup" accessibilityLabel={label}>{options.map(([key,text])=>{const active=value===key,foreground=active?c.text:c.muted,color=compact?c.active:key==='income'?c.income:c.expense;return <Pressable key={key} accessibilityRole="radio" accessibilityLabel={text} accessibilityState={{checked:active,disabled}} aria-checked={active} disabled={disabled} onPress={()=>onChange(key)} style={[styles.segment,compact?styles.scopeSegment:styles.typeSegment,{backgroundColor:active?color:compact?'transparent':c.neutral,borderColor:active?color:c.line}]}>{!compact?<View accessible={false} style={[styles.arrow,{borderColor:foreground}]}><Text style={{color:foreground,fontSize:17,lineHeight:21}}>{key==='income'?'↑':'↓'}</Text></View>:null}<Text style={[styles.segmentText,{fontSize:compact?16:18,color:foreground}]}>{text}</Text></Pressable>;})}</View>;
}
export function TransactionLink({title,onPress,disabled=false,testID}:{title:string;onPress():void;disabled?:boolean;testID?:string}){return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{disabled}} disabled={disabled} onPress={onPress} style={styles.link}><Text style={styles.linkText}>{title}</Text></Pressable>;}
export function TransactionError({message}:{message:string}){return message?<View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}><Text style={{color:c.error,fontSize:15,lineHeight:22}}>{message}</Text></View>:null;}
export function TransactionSaveButton({title,onPress,busy}:{title:string;onPress():void;busy:boolean}){
 const [ticket,setTicket]=useState<number|null>(null),notice=useSyncExternalStore(subscribeSaveNotice,getSaveNotice,serverSaveNotice),succeeded=ticket!==null&&notice?.ticket===ticket;
 return <Pressable testID="movement-save" accessibilityRole="button" accessibilityLabel={busy?'Guardando':succeeded?'Guardado exitosamente':title} accessibilityState={{disabled:busy,busy}} disabled={busy} onPress={()=>{setTicket(beginSaveAction(title));onPress();}} style={[styles.save,{opacity:busy?0.7:1}]}>{busy?<ActivityIndicator color="#FFFFFF" accessibilityLabel="Guardando transacción"/>:<Text accessible={false} style={styles.saveCheck}>✓</Text>}<Text style={styles.saveText}>{busy?'Guardando…':succeeded?'Guardado exitosamente':title}</Text></Pressable>;
}
export const transactionStyles=StyleSheet.create({
 section:{gap:14,minWidth:0},heading:{fontSize:20,lineHeight:27,fontWeight:'700',color:c.text,marginTop:6},
 text:{fontSize:15,lineHeight:22,color:c.muted},options:{gap:14,padding:12,borderRadius:12,backgroundColor:c.panel},
 history:{gap:12,backgroundColor:'#FFFFFF',padding:12,borderRadius:12},readOnly:{padding:12,minHeight:48,justifyContent:'center',borderRadius:12,backgroundColor:c.field},
});
const styles=StyleSheet.create({
 backdrop:{flex:1,justifyContent:'center',paddingHorizontal:8,backgroundColor:'#00101899'},sheet:{width:'100%',maxWidth:620,height:'100%',maxHeight:940,minHeight:0,alignSelf:'center',borderRadius:22,backgroundColor:c.background,overflow:'hidden'},
 header:{flexDirection:'row',alignItems:'center',gap:2,paddingLeft:18,paddingRight:8,paddingVertical:8,borderBottomWidth:1,borderColor:c.line},title:{fontSize:24,lineHeight:30,fontWeight:'800',color:c.text,flex:1,minWidth:0},headerButton:{width:44,height:44,alignItems:'center',justifyContent:'center'},closeIcon:{fontSize:32,lineHeight:36,color:c.text},keyboardIcon:{fontSize:21,color:c.muted},
 scroll:{flex:1,minHeight:0,width:'100%'},content:{padding:18,paddingBottom:30,gap:14},types:{flexDirection:'row',gap:10},scope:{flexDirection:'row',padding:4,borderRadius:24,backgroundColor:c.neutral,gap:4},segment:{flex:1,minWidth:0,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},typeSegment:{minHeight:62,paddingHorizontal:8,paddingVertical:10,borderWidth:1,borderRadius:14},scopeSegment:{minHeight:40,paddingHorizontal:8,paddingVertical:6,borderWidth:0,borderRadius:20},segmentText:{fontWeight:'600',flexShrink:1,textAlign:'center'},arrow:{width:23,height:23,borderRadius:12,borderWidth:1.5,alignItems:'center',justifyContent:'center'},
 link:{minHeight:44,justifyContent:'center',alignSelf:'flex-end',paddingHorizontal:2},linkText:{fontSize:15,lineHeight:22,fontWeight:'600',color:c.link},error:{paddingVertical:6},save:{minHeight:52,padding:12,borderRadius:12,backgroundColor:c.save,flexDirection:'row',gap:10,alignItems:'center',justifyContent:'center'},saveText:{fontSize:18,lineHeight:24,fontWeight:'700',color:c.text,flexShrink:1},saveCheck:{fontSize:21,color:c.text},
});
