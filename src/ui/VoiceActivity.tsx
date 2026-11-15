import {useEffect,useState} from 'react';
import {AccessibilityInfo,ActivityIndicator,Animated,View} from 'react-native';
import {Body} from './components';
export function VoiceActivity({phase}:{phase:'idle'|'starting'|'listening'|'stopping'}){
 const [motion]=useState(()=>new Animated.Value(0)),[reduce,setReduce]=useState(true);
 useEffect(()=>{let live=true;void AccessibilityInfo.isReduceMotionEnabled().then(v=>{if(live)setReduce(v);}).catch(()=>undefined);const sub=AccessibilityInfo.addEventListener('reduceMotionChanged',setReduce);return()=>{live=false;sub.remove();};},[]);
 useEffect(()=>{if(reduce||phase!=='listening')return;const loop=Animated.loop(Animated.sequence([Animated.timing(motion,{toValue:1,duration:420,useNativeDriver:true}),Animated.timing(motion,{toValue:0,duration:420,useNativeDriver:true})]));loop.start();return()=>loop.stop();},[phase,reduce,motion]);
 if(phase==='idle')return null;
 const listening=phase==='listening';return <View accessibilityRole="status" accessibilityLiveRegion="polite" style={{minHeight:88,borderRadius:18,padding:14,backgroundColor:listening?'#811C45':'#074D68',borderWidth:2,borderColor:listening?'#FF7EAD':'#55DCF2',flexDirection:'row',alignItems:'center',justifyContent:'center',gap:16}}>{listening?<View aria-hidden style={{height:52,flexDirection:'row',alignItems:'center',gap:5}}>{[18,34,48,28,42].map((height,i)=><Animated.View key={i} style={{height,width:7,borderRadius:4,backgroundColor:i%2?'#60FFE0':'#FFE17A',transform:[{scaleY:reduce?1:motion.interpolate({inputRange:[0,1],outputRange:i%2?[1,.4]:[.4,1]})}]}}/>)}</View>:<ActivityIndicator size="large" color="#79EDFF"/>}<Body style={{flexShrink:1,fontSize:23,lineHeight:29,fontWeight:'800',color:'#FFFFFF'}}>{listening?'Escuchando…':phase==='starting'?'Preparando micrófono…':'Terminando…'}</Body></View>;
}
