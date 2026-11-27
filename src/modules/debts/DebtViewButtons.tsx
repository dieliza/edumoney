import {Pressable,Text,View,useWindowDimensions} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme} from '../../design/ThemeProvider';
import type {IconName} from '../../ui/components';
import {debtViewColors,debtViewOptions} from './debtViews';
const icons:Record<string,IconName>={debts:'card-outline',bills:'document-text-outline',scheduled:'cash-outline',calendar:'calendar-outline',simulator:'calculator-outline',notices:'notifications-outline'};
export function DebtViewButtons({value,onChange}:{value:string;onChange(value:string):void}){
 const{width}=useWindowDimensions(),{name}=useTheme();
 return <View testID="debt-view-buttons" accessibilityLabel="Vista de deudas" style={{flexDirection:'row',flexWrap:'wrap',gap:12,width:'100%'}}>{debtViewOptions.map(([id,title])=><Pressable key={id} testID={`debt-view-${id}`} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{selected:value===id}} onPress={()=>onChange(id)} style={({pressed})=>({flexBasis:width<380?'45%':width<600?'30%':'15%',flexGrow:1,flexShrink:1,minWidth:0,borderRadius:22,opacity:pressed?0.82:1})}><LinearGradient colors={value===id?['#FFE9A7','#E5B843']:name==='dark'?['#84DBE4','#338998']:['#6DC9DA','#276E88']} start={{x:0,y:0}} end={{x:1,y:1}} style={{padding:3,borderRadius:22}}><LinearGradient colors={[debtViewColors[id],'#123A4D']} start={{x:0,y:0}} end={{x:1,y:1}} style={{height:132,borderRadius:19,paddingHorizontal:6,paddingVertical:12,alignItems:'center',justifyContent:'center',gap:8}}><View pointerEvents="none" style={{width:44,height:44,borderRadius:15,backgroundColor:'rgba(255,255,255,0.16)',alignItems:'center',justifyContent:'center'}}><Ionicons name={icons[id]} size={30} color="#FFFFFF"/></View><Text style={{fontWeight:'800',fontSize:width<600?13:15,lineHeight:19,textAlign:'center',color:'#FFFFFF'}}>{title}</Text></LinearGradient></LinearGradient></Pressable>)}</View>;
}
