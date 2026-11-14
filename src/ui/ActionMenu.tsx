import {useState} from 'react';
import {Pressable,ScrollView,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body,CloseButton} from './components';
import {fixed} from '../design/tokens';
import {useTheme} from '../design/ThemeProvider';
export type MenuAction={id:string;label:string;testID?:string;run():void};
export function ActionMenu({actions,label='Opciones'}:{actions:MenuAction[];label?:string}){
 const [open,setOpen]=useState(false);const {colors}=useTheme();
 const menuActions=actions;
 return <View style={{flex:1,gap:8}}><Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{expanded:open}} onPress={()=>setOpen(!open)} style={{minHeight:54,backgroundColor:colors.surfaceAlt,borderWidth:1,borderColor:colors.line,borderRadius:16,padding:14,flexDirection:'row',alignItems:'center',gap:12}}><Body style={{flex:1,fontWeight:'700'}}>{label}</Body><Ionicons name="chevron-down" size={22} color={colors.primary}/></Pressable>{open?<View style={{borderWidth:1,borderColor:colors.line,borderRadius:16,padding:8,backgroundColor:colors.surface,gap:8}}><ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{maxHeight:320}}>{menuActions.map(action=><Pressable key={action.id} testID={action.testID} accessibilityRole="button" accessibilityLabel={action.label} onPress={()=>{setOpen(false);action.run();}} style={{minHeight:50,padding:14,borderRadius:12,justifyContent:'center',backgroundColor:colors.surfaceAlt,marginBottom:6}}><Body>{action.label}</Body></Pressable>)}</ScrollView><CloseButton label={`Cerrar ${label}`} onPress={()=>setOpen(false)}/></View>:null}</View>;
}

export function CameraActionButton({onPress,label='Tomar foto',testID}:{onPress():void;label?:string;testID?:string}){
 const {colors}=useTheme();
 return <View style={{width:'25%',minWidth:48}}><Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>({minHeight:54,padding:8,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary,borderRadius:16,opacity:pressed?0.7:1})}><Ionicons name="camera-outline" size={24} color={fixed.white}/><Body style={{color:fixed.white,fontSize:12,lineHeight:16}}>Foto</Body></Pressable></View>;
}
