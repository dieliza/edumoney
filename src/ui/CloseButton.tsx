import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {fixed} from '../design/tokens';
export function CloseButton({onPress,label='Cerrar ficha',testID}:{onPress():void;label?:string;testID?:string}){
 return <Pressable testID={testID} accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={{width:48,height:48,flexShrink:0,borderRadius:16,backgroundColor:fixed.buttonStart,alignItems:'center',justifyContent:'center',alignSelf:'flex-end',zIndex:2}}><View pointerEvents="none"><Ionicons name="close" size={28} color={fixed.white} accessible={false} aria-hidden/></View></Pressable>;
}
