import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body,Card} from './components';
import {useTheme} from '../design/ThemeProvider';
import {topExpenses} from '../modules/money/analysisModel';
import {formatMoney} from '../modules/money/domain';
import type {ExpenseSlice} from './expenseSegments';
export function ExpenseTopThree({items,month,onOpen}:{items:readonly ExpenseSlice[];month:string;onOpen():void}){const {colors}=useTheme();const rows=topExpenses(items);return <Card><View style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1}}><Body style={{fontWeight:'800',fontSize:19}}>Top 3 de gastos</Body><Body muted style={{fontSize:13}}>{month} · Por categoría</Body></View><Pressable testID="open-expense-breakdown" accessibilityRole="button" accessibilityLabel={`Ver desglose completo de categorías de ${month}`} onPress={onOpen} style={{width:46,height:46,borderRadius:23,backgroundColor:colors.mint,alignItems:'center',justifyContent:'center'}}><Ionicons name="arrow-forward" size={24} color={colors.primary}/></Pressable></View>{rows.map((c,i)=><View key={c.id} style={{flexDirection:'row',gap:12,alignItems:'center'}}><Body muted>{i+1}</Body><Body style={{flex:1}}>{c.name}</Body><Body style={{fontWeight:'800'}}>{formatMoney(c.spent)}</Body></View>)}{!rows.length?<Body muted>No hay gastos registrados en este período.</Body>:null}</Card>;}
