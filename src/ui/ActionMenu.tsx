import {SelectControl} from './SelectControl';
import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body} from './components';
import {fixed} from '../design/tokens';
import {useTheme} from '../design/ThemeProvider';
export type MenuAction={id:string;label:string;testID?:string;run():void};
export function ActionMenu({actions,label='Opciones'}:{actions:MenuAction[];label?:string}){
 return <SelectControl action label={label} value="" options={actions.map(a=>[a.id,a.label] as const)} optionTestIDs={Object.fromEntries(actions.map(a=>[a.id,a.testID]))} onChange={id=>actions.find(a=>a.id===id)?.run()}/>;
}

export function CameraActionButton({onPress,label='Tomar foto',testID}:{onPress():void;label?:string;testID?:string}){
 const {colors}=useTheme();
 return <View style={{width:'25%',minWidth:48}}><Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({pressed})=>({minHeight:54,padding:8,alignItems:'center',justifyContent:'center',backgroundColor:colors.primary,borderRadius:16,opacity:pressed?0.7:1})}><Ionicons name="camera-outline" size={24} color={fixed.white}/><Body style={{color:fixed.white,fontSize:12,lineHeight:16}}>Foto</Body></Pressable></View>;
}
