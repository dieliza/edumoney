import {type ReactNode} from 'react';
import {Pressable,View} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body} from './components';
import {ExpenseTopThree} from './ExpenseTopThree';
import {useTheme} from '../design/ThemeProvider';
import {formatMoney,type monthlySummary} from '../modules/money/domain';
type Props={summary:ReturnType<typeof monthlySummary>;month:string;currentMonth:string;periodEditor?:ReactNode;actions:ReactNode;onPeriod():void;onBreakdown():void};
export function MoneyOverview(p:Props){const {colors,name}=useTheme();const heading=name==='dark'?'#F1FFFC':colors.text;return <View testID="money-overview-redesign" style={{gap:12}}>
 <View style={{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Body style={{fontSize:24,lineHeight:30,fontWeight:'800',color:heading}}>¡Hola!</Body><Body style={{fontSize:13,lineHeight:18,color:name==='dark'?'#C7EAE4':colors.muted}}>Aquí tienes el resumen de tus finanzas.</Body></View><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar período. Actual: ${p.month}`} onPress={p.onPeriod} style={{minHeight:44,paddingHorizontal:12,borderRadius:13,borderWidth:1,borderColor:name==='dark'?'#77B3B3':colors.line,flexDirection:'row',alignItems:'center',gap:7}}><Ionicons name="calendar-outline" size={18} color={heading}/><Body style={{fontSize:13,color:heading}}>{p.month===p.currentMonth?'Este mes':p.month}</Body><Ionicons name="chevron-down" size={15} color={heading}/></Pressable></View>
 {p.periodEditor}
 <LinearGradient colors={['#0BAE61','#00774F','#034343']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:20,padding:18,borderWidth:1,borderColor:'#44E58B',minHeight:112,justifyContent:'center',overflow:'hidden',gap:5,boxShadow:'0px 5px 20px rgba(0,200,100,.15)'}}>
 <View pointerEvents="none" aria-hidden style={{position:'absolute',right:-28,top:-45,width:180,height:180,borderRadius:90,borderWidth:26,borderColor:'rgba(73,255,174,.1)'}}/>
 <View style={{flexDirection:'row',alignItems:'center',gap:13}}><View style={{width:50,height:50,borderRadius:25,borderWidth:1,borderColor:'#89E5B5',alignItems:'center',justifyContent:'center'}}><Ionicons name="wallet-outline" size={28} color="#F1FFF9"/></View><View style={{flex:1}}><Body style={{fontSize:14,lineHeight:20,color:'#EDFFF2',fontWeight:'600'}}>Saldo disponible estimado</Body><Body style={{fontSize:38,lineHeight:46,color:'#FFFFFF',fontWeight:'800',letterSpacing:-1}}>{formatMoney(p.summary.available)}</Body></View></View><Body style={{fontSize:11,lineHeight:16,color:'#E0F8ED'}}>Según tus registros · No es un saldo bancario confirmado</Body></LinearGradient>
 {p.actions}
 <ExpenseTopThree items={p.summary.distribution} month={p.month} onOpen={p.onBreakdown}/>
 </View>;}
