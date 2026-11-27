import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Svg,{Circle,Path,Rect} from 'react-native-svg';
import {useTheme} from '../design/ThemeProvider';
/** Decorative document/microphone mark; navigation remains with the caller. */
export function DictationHistoryButton({onPress}:{onPress():void}){
 const {width}=useWindowDimensions(),{name}=useTheme(),small=width<600;
 const shape={borderTopLeftRadius:30,borderTopRightRadius:10,borderBottomRightRadius:30,borderBottomLeftRadius:10};
 return <Pressable testID="home-my-dictations" accessibilityRole="button" accessibilityLabel="Mi historial de dictados" onPress={onPress} style={({pressed})=>({flexBasis:width<360?'45%':'22%',flexGrow:1,flexShrink:1,maxWidth:300,minWidth:width<360?120:58,opacity:pressed?0.82:1,...shape,boxShadow:name==='dark'?'0px 5px 16px #00CBE538':'0px 4px 12px #07548230'})}>
 <LinearGradient colors={name==='dark'?['#66E8F0','#1699BD']:['#20BBD0','#087C9F']} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:2,...shape,overflow:'hidden'}}>
 <LinearGradient colors={['#087F9E','#075482','#123A61']} start={{x:0,y:0}} end={{x:1,y:1}} style={{...shape,minHeight:small?120:174,paddingHorizontal:5,paddingTop:small?8:13,paddingBottom:15,alignItems:'center',justifyContent:'center',gap:small?3:6}}>
 <View pointerEvents="none" style={{width:small?56:100,height:small?51:82}}><Svg width="100%" height="100%" viewBox="0 0 120 96" aria-hidden>
 <Path d="M23 10 H66 L83 27 V85 H23 Z" fill="#F0FCFF" stroke="#B6F4FA" strokeWidth={2}/><Path d="M66 10 V27 H83 M34 39 H57 M34 49 H52 M34 60 H47" fill="none" stroke="#147895" strokeWidth={4} strokeLinecap="round"/>
 <Rect x={63} y={35} width={18} height={29} rx={9} fill="#16AEBD" stroke="#FFFFFF" strokeWidth={2}/><Path d="M57 55 V59 C57 79 87 79 87 59 V55 M72 74 V83 M64 83 H80" fill="none" stroke="#FFFFFF" strokeWidth={4} strokeLinecap="round"/>
 <Circle cx={94} cy={25} r={17} fill="#FFE08A" stroke="#FFF4CF" strokeWidth={2}/><Path d="M94 15 V25 L102 30" fill="none" stroke="#714511" strokeWidth={3.5} strokeLinecap="round"/>
 </Svg></View>
 <Text style={{fontSize:small?(width<360?14:12):22,lineHeight:small?18:26,fontWeight:'800',color:'#FFFFFF',textAlign:'center'}}>Mi historial{'\n'}de dictados</Text>
 </LinearGradient></LinearGradient></Pressable>;
}
