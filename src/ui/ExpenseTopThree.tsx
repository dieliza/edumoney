import {categoryDisplayName} from '../modules/money/categoryLabels';
import {categoryAppearance} from './categoryAppearance';
import {expenseSegments} from './expenseSegments';
import {View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body,Card} from './components';
import {useTheme} from '../design/ThemeProvider';
import {topExpenses} from '../modules/money/analysisModel';
import {formatMoney} from '../modules/money/domain';
import type {ExpenseSlice} from './expenseSegments';
export function ExpenseTopThree({items}:{items:readonly ExpenseSlice[];month:string;onOpen():void}){const {colors}=useTheme();const rows=topExpenses(items.map(c=>({...c,name:categoryDisplayName(c.name)})));const segments=expenseSegments(items);return <Card chart style={{padding:14,gap:7}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Body style={{fontWeight:'800',fontSize:18}}>¿En qué gastaste más?</Body></View></View>{rows.map(c=>{const visual=categoryAppearance(c.id,c.name),fraction=segments.find(s=>s.id===c.id)?.fraction??0;return <View key={c.id} style={{flexDirection:'row',gap:10,alignItems:'center',minHeight:42}}><View style={{width:32,height:32,borderRadius:9,backgroundColor:visual.color,alignItems:'center',justifyContent:'center'}}><Ionicons name={visual.icon} size={20} color="#FFFFFF"/></View><View style={{flex:1,gap:4}}><View style={{flexDirection:'row',gap:8,alignItems:'center'}}><Body style={{flex:1,fontWeight:'700',fontSize:14,lineHeight:19}}>{c.name}</Body><Body style={{fontWeight:'800',fontSize:13,lineHeight:19}}>{formatMoney(c.spent)} <Body muted style={{fontSize:11}}>({Math.round(fraction*100)}%)</Body></Body></View><View accessibilityLabel={`${c.name}: ${Math.round(fraction*100)}% del gasto`} style={{height:5,borderRadius:3,backgroundColor:colors.progressTrack}}><View style={{width:`${fraction*100}%`,height:5,borderRadius:3,backgroundColor:visual.color}}/></View></View></View>;})}{!rows.length?<Body muted>No hay gastos registrados en este período.</Body>:null}</Card>;}
