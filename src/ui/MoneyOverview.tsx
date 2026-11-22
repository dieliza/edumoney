import {HomeBalancesAndCharts,AccountExpenseTopThree} from './HomeBalancesAndCharts';
import type {Category,LedgerMovement} from '../modules/money/types';
import {type ReactNode} from 'react';
import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body} from './components';
import {useTheme} from '../design/ThemeProvider';
import {type monthlySummary} from '../modules/money/domain';
type Props={movements?:LedgerMovement[];categories?:Category[];summary:ReturnType<typeof monthlySummary>;month:string;currentMonth:string;periodEditor?:ReactNode;actions:ReactNode;onPeriod():void;onBreakdown():void};
export function MoneyOverview(p:Props){const {colors,name}=useTheme();const heading=name==='dark'?'#F1FFFC':colors.text;return <View testID="money-overview-redesign" style={{gap:12}}>
 <View style={{flexDirection:'row',gap:12,alignItems:'center',justifyContent:'space-between'}}><View style={{flex:1}}><Body style={{fontSize:24,lineHeight:30,fontWeight:'800',color:heading}}>¡Hola!</Body><Body style={{fontSize:13,lineHeight:18,color:name==='dark'?'#C7EAE4':colors.muted}}>Aquí tienes el resumen de tus finanzas.</Body></View><Pressable accessibilityRole="button" accessibilityLabel={`Cambiar período. Actual: ${p.month}`} onPress={p.onPeriod} style={{minHeight:44,paddingHorizontal:12,borderRadius:13,borderWidth:1,borderColor:name==='dark'?'#77B3B3':colors.line,flexDirection:'row',alignItems:'center',gap:7}}><Ionicons name="calendar-outline" size={18} color={heading}/><Body style={{fontSize:13,color:heading}}>{p.month===p.currentMonth?'Este mes':p.month}</Body><Ionicons name="chevron-down" size={15} color={heading}/></Pressable></View>
 {p.periodEditor}
 <HomeBalancesAndCharts summary={p.summary} month={p.month} movements={p.movements} categories={p.categories}/>
 {p.actions}
 <AccountExpenseTopThree summary={p.summary} movements={p.movements} categories={p.categories} month={p.month} onOpen={p.onBreakdown}/>
 </View>;}
