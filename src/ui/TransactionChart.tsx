import {useState} from 'react';
import {Pressable,View} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body} from './components';
import {ChartBars} from './ChartBars';
import {useTheme} from '../design/ThemeProvider';
import type {TransactionPoint} from '../modules/money/transactionChartModel';
export function TransactionChart({rows,compact=false}:{rows:TransactionPoint[];compact?:boolean}){
 const {colors,name}=useTheme(),[vertical,setVertical]=useState(false),[limit,setLimit]=useState(compact?5:20);
 const visible=rows.slice(0,limit),income=name==='dark'?'#38E795':'#087747',expense=name==='dark'?'#FF6381':'#B91C42';
 return <View style={{gap:12}}><View style={{flexDirection:'row',alignItems:'center',gap:8}}><Body style={{fontWeight:'700',fontSize:compact?15:18,flex:1}}>Una barra por transacción</Body><Pressable accessibilityRole="button" accessibilityLabel={vertical?'Ver barras horizontales':'Ver columnas verticales'} onPress={()=>setVertical(!vertical)} style={{width:44,height:44,alignItems:'center',justifyContent:'center'}}><Ionicons name={vertical?'reorder-four-outline':'bar-chart-outline'} size={22} color={colors.primary}/></Pressable></View>
 <View style={{flexDirection:'row',gap:16}}><Body style={{color:income,fontSize:13}}>● Ingreso</Body><Body style={{color:expense,fontSize:13}}>● Gasto</Body></View>
 {rows.length?<ChartBars rows={visible.map(r=>({id:r.id,label:`${r.date} · ${r.kind==='income'?'Ingreso':'Gasto'} · ${r.categoryName}${r.archived?' (archivada)':''}${r.description?` · ${r.description}`:''}`,amount:r.amountCents,color:r.kind==='income'?income:expense}))} vertical={vertical}/>:<Body muted>No hay ingresos o gastos registrados para esta selección.</Body>}
 {rows.length>visible.length?<Pressable accessibilityRole="button" accessibilityLabel="Mostrar más transacciones en la gráfica" onPress={()=>setLimit(limit+(compact?5:20))} style={{minHeight:44,justifyContent:'center'}}><Body style={{color:colors.primary,fontWeight:'700'}}>Ver más transacciones ({visible.length} de {rows.length})</Body></Pressable>:null}</View>;
}
