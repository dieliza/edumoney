import {ChartBars} from './ChartBars';
import {useMemo,useState} from 'react';
import {Pressable,View} from 'react-native';
import Svg,{Circle} from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import {Body} from './components';
import {ExpenseDonut} from './ExpenseDonut';
import {expenseSegments} from './expenseSegments';
import {monthlyChartModel} from './monthlyCharts';
import {useTheme} from '../design/ThemeProvider';
import {fixed} from '../design/tokens';
import {formatMoney,type monthlySummary} from '../modules/money/domain';
import type {LedgerMovement} from '../modules/money/types';
export function MonthlyCharts({summary,movements,month,onSelect}:{summary:ReturnType<typeof monthlySummary>;movements:LedgerMovement[];month:string;onSelect?(id:string):void}){
 const {colors}=useTheme();const [selected,setSelected]=useState('overview');const [chartStyle,setChartStyle]=useState<'ring'|'horizontal'|'vertical'>('ring');
 const model=useMemo(()=>monthlyChartModel(summary,movements,month),[summary,movements,month]);const index=Math.max(0,model.pages.indexOf(selected));const page=model.pages[index];
 const category=model.categories.find(c=>`category:${c.id}`===page);const items=expenseSegments(model.categories);
 const next=()=>setSelected(model.pages[(index+1)%model.pages.length]);
 const previous=()=>setSelected(model.pages[(index+model.pages.length-1)%model.pages.length]);
 const title=page==='overview'?'Ingresos y gastos':page==='distribution'?'Gastos por categoría':category?.name??'Ingresos y gastos';
 const visible=category?.transactions.slice(0,10)??[];const maximum=visible.reduce((max,m)=>Math.max(max,m.amountCents),1);
 const track=colors.progressTrack;
 const barRows=page==='overview'?[{id:'income',label:'Ingresos',amount:summary.income,color:fixed.income},{id:'expense',label:'Gastos',amount:summary.expenses,color:fixed.expense}]:category?visible.map(m=>({id:m.id,label:`${m.date} ${m.description||category.name}`,amount:m.amountCents,color:colors.primary})):items.map(c=>({id:c.id,label:c.name,amount:c.spent,color:c.color}));
 return <View style={{gap:16}}>
  <View style={{flexDirection:'row',alignItems:'center',gap:8}}><Body style={{fontWeight:'800',flex:1}}>{title}</Body><Pressable testID="chart-format" accessibilityRole="button" accessibilityLabel={`Cambiar formato de gráfica. Actual: ${chartStyle==='ring'?'Circular':chartStyle==='horizontal'?'Barras horizontales':'Columnas verticales'}`} onPress={()=>setChartStyle(chartStyle==='ring'?'horizontal':chartStyle==='horizontal'?'vertical':'ring')} style={{width:46,height:46,borderRadius:23,backgroundColor:colors.mint,alignItems:'center',justifyContent:'center'}}><Ionicons name={chartStyle==='ring'?'bar-chart-outline':chartStyle==='horizontal'?'stats-chart-outline':'pie-chart-outline'} size={24} color={colors.primary}/></Pressable>{model.pages.length>1?<><Pressable accessibilityRole="button" accessibilityLabel="Ver gráfica anterior" onPress={previous} style={{minWidth:44,minHeight:48,alignItems:'center',justifyContent:'center'}}><Ionicons name="chevron-back" size={22} color={colors.primary}/></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Ver siguiente gráfica, ${index+1} de ${model.pages.length}`} onPress={next} style={{minHeight:48,paddingHorizontal:10,borderRadius:12,backgroundColor:colors.mint,flexDirection:'row',alignItems:'center',gap:6}}><Ionicons name="layers-outline" size={22} color={colors.primary}/><Body style={{fontSize:13}}>{index+1}/{model.pages.length}</Body></Pressable></>:null}</View>
  {chartStyle!=='ring'?<ChartBars rows={barRows} vertical={chartStyle==='vertical'}/>:null}
  {page==='overview'?<>
   {chartStyle==='ring'?<View accessible accessibilityLabel={`Ingresos del mes ${formatMoney(summary.income)}. Gastos del mes ${formatMoney(summary.expenses)}. Ambos anillos usan la misma escala.`} style={{height:232,alignItems:'center',justifyContent:'center'}}>
    <Svg width={232} height={232} viewBox="0 0 232 232" aria-hidden>
     {[{r:92,color:fixed.income,fraction:model.incomeFraction},{r:68,color:fixed.expense,fraction:model.expenseFraction}].map(r=><Circle key={`track-${r.r}`} cx={116} cy={116} r={r.r} fill="none" stroke={track} strokeWidth={16}/>)}
     {[{r:92,color:fixed.income,fraction:model.incomeFraction},{r:68,color:fixed.expense,fraction:model.expenseFraction}].filter(r=>r.fraction>0).map(r=><Circle key={r.r} cx={116} cy={116} r={r.r} fill="none" stroke={r.color} strokeWidth={16} strokeDasharray={`${2*Math.PI*r.r*r.fraction} ${2*Math.PI*r.r}`} transform="rotate(-90 116 116)"/>)}
    </Svg>
    <View pointerEvents="none" style={{position:'absolute',alignItems:'center',maxWidth:116}}><Body style={{fontSize:12,lineHeight:16}}>Ingresos</Body><Body style={{fontSize:18,lineHeight:24,fontWeight:'800'}}>{formatMoney(summary.income)}</Body><Body style={{fontSize:12,lineHeight:16}}>Gastos</Body><Body style={{fontSize:18,lineHeight:24,fontWeight:'800'}}>{formatMoney(summary.expenses)}</Body></View>
   </View>:null}
   <View style={{gap:8}}><Body>🟢 {chartStyle==='ring'?'Anillo exterior · ':''}Ingresos: {formatMoney(summary.income)}</Body><Body>🔴 {chartStyle==='ring'?'Anillo interior · ':''}Gastos: {formatMoney(summary.expenses)}</Body><Body>{model.difference<0?`Los gastos superan los ingresos en ${formatMoney(-model.difference)}.`:`Diferencia entre ingresos y gastos: ${formatMoney(model.difference)}.`}</Body></View>
   <Body muted style={{fontSize:13}}>Las vistas usan la misma escala. Esta diferencia no equivale al disponible: préstamos, pagos de deuda, metas y compromisos se muestran por separado en el resumen.</Body>
   <Body muted style={{fontSize:13}}>{model.pages.length>1?'Toca el botón de capas para ver la distribución y las gráficas de cada categoría.':'Al registrar gastos aparecerán la distribución y nuevas gráficas por categoría.'}</Body>
  </>:null}
  {page==='distribution'&&chartStyle==='ring'?<ExpenseDonut items={model.categories} total={summary.expenses} onSelect={onSelect}/>:null}
  {category?<>
   {chartStyle==='ring'?<ExpenseDonut items={[category]} total={category.spent} onSelect={onSelect}/>:null}
   <Body style={{fontSize:26,lineHeight:34,fontWeight:'800'}}>{formatMoney(category.spent)}</Body><Body>{category.transactions.length} gasto(s) en esta categoría durante {month}.</Body>
   {chartStyle==='ring'?<View style={{gap:14}}>{visible.map(m=>{const width=Number(BigInt(m.amountCents)*10000n/BigInt(maximum))/100;return <View key={m.id} style={{gap:6}}><View style={{flexDirection:'row',gap:12,justifyContent:'space-between'}}><Body style={{flex:1,fontSize:14}}>{m.date} · {m.description||category.name}</Body><Body style={{fontSize:14,fontWeight:'700'}}>{formatMoney(m.amountCents)}</Body></View><View accessible accessibilityLabel={`Gasto ${m.description||category.name}: ${formatMoney(m.amountCents)}`} style={{height:14,borderRadius:8,backgroundColor:track,overflow:'hidden'}}><View style={{height:14,width:`${width}%`,borderRadius:8,backgroundColor:items.find(c=>c.id===category.id)?.color??colors.primary}}/></View></View>;})}</View>:null}
   {category.transactions.length>10?<Body muted>Se muestran los diez gastos más recientes. El total incluye todos los del mes.</Body>:null}
   {onSelect?<Pressable accessibilityRole="button" accessibilityLabel={`Ver todos los movimientos de ${category.name}`} onPress={()=>onSelect(category.id)} style={{minHeight:48,padding:12,borderRadius:12,backgroundColor:colors.mint,alignItems:'center',justifyContent:'center'}}><Body>Ver movimientos de esta categoría</Body></Pressable>:null}
  </>:null}
 </View>;
}
