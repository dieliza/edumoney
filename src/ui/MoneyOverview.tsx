import {NeonActionButton} from './NeonActionButton';
import {type ReactNode} from 'react';
import {Pressable,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body,Card} from './components';
import {MonthlyCharts} from './MonthlyCharts';
import {ExpenseTopThree} from './ExpenseTopThree';
import {useTheme} from '../design/ThemeProvider';
import {formatMoney,type monthlySummary} from '../modules/money/domain';
import type {LedgerMovement} from '../modules/money/types';
type Props={summary:ReturnType<typeof monthlySummary>;movements:LedgerMovement[];month:string;currentMonth:string;periodEditor?:ReactNode;onPeriod():void;onIncome():void;onExpense():void;onScan():void;onDebts():void;onBreakdown():void};
export function MoneyOverview(p:Props){const {colors,name}=useTheme();const {width,fontScale}=useWindowDimensions();const wide=width>=820&&fontScale<1.5;const heading=name==='dark'?'#F1FFFC':colors.text;return <View testID="money-overview-redesign" style={{gap:12}}>
 <View style={{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Body style={{fontSize:24,lineHeight:30,fontWeight:'800',color:heading}}>¡Hola!</Body><Body style={{fontSize:13,lineHeight:18,color:name==='dark'?'#C7EAE4':colors.muted}}>Aquí tienes el resumen de tus finanzas.</Body></View><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar período. Actual: ${p.month}`} onPress={p.onPeriod} style={{minHeight:44,paddingHorizontal:12,borderRadius:13,borderWidth:1,borderColor:name==='dark'?'#77B3B3':colors.line,flexDirection:'row',alignItems:'center',gap:7}}><Ionicons name="calendar-outline" size={18} color={heading}/><Body style={{fontSize:13,color:heading}}>{p.month===p.currentMonth?'Este mes':p.month}</Body><Ionicons name="chevron-down" size={15} color={heading}/></Pressable></View>
 {p.periodEditor}
 <View style={{flexDirection:wide?'row':'column',gap:12,alignItems:'stretch'}}>
 <LinearGradient colors={['#0BAE61','#00774F','#034343']} start={{x:0,y:0}} end={{x:1,y:1}} style={{flex:wide ? 0.9 : undefined,borderRadius:20,padding:18,borderWidth:1,borderColor:'#44E58B',minHeight:112,justifyContent:'center',overflow:'hidden',gap:5,boxShadow:'0px 5px 20px rgba(0,200,100,.15)'}}>
 <View pointerEvents="none" aria-hidden style={{position:'absolute',right:-28,top:-45,width:180,height:180,borderRadius:90,borderWidth:26,borderColor:'rgba(73,255,174,.1)'}}/>
 <View style={{flexDirection:'row',alignItems:'center',gap:13}}><View style={{width:50,height:50,borderRadius:25,borderWidth:1,borderColor:'#89E5B5',alignItems:'center',justifyContent:'center'}}><Ionicons name="wallet-outline" size={28} color="#F1FFF9"/></View><View style={{flex:1}}><Body style={{fontSize:14,lineHeight:20,color:'#EDFFF2',fontWeight:'600'}}>Saldo disponible estimado</Body><Body style={{fontSize:38,lineHeight:46,color:'#FFFFFF',fontWeight:'800',letterSpacing:-1}}>{formatMoney(p.summary.available)}</Body></View></View><Body style={{fontSize:11,lineHeight:16,color:'#E0F8ED'}}>Según tus registros · No es un saldo bancario confirmado</Body></LinearGradient>
 <View style={{flex:wide ? 1.1 : undefined}}><Card chart style={{padding:14,borderRadius:20}}><MonthlyCharts compact summary={p.summary} movements={p.movements} month={p.month}/></Card></View>
 </View>
 <View style={{flexDirection:'row',gap:10,width:'100%',maxWidth:920,alignSelf:'center',justifyContent:'space-between'}}><NeonActionButton kind="income" title="Ingreso" onPress={p.onIncome}/><NeonActionButton kind="expense" title="Gasto" onPress={p.onExpense}/><NeonActionButton kind="scan" title={'Escanear\nrecibo'} testID="open-documents" onPress={p.onScan}/><NeonActionButton kind="debts" title="Deudas" testID="open-debts" onPress={p.onDebts}/></View>
 <ExpenseTopThree items={p.summary.distribution} month={p.month} onOpen={p.onBreakdown}/>
 </View>;}
