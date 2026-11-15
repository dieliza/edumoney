import {MonthlyCharts} from '../../ui/MonthlyCharts';
import {ExpenseDonut} from '../../ui/ExpenseDonut';
import {categoryAppearance} from '../../ui/categoryAppearance';
import {useCallback,useEffect,useMemo,useState} from 'react';
import {ActivityIndicator,AppState,Pressable,View} from 'react-native';
import {router,useIsFocused} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {ActionButton,Body,Card,Screen} from '../../ui/components';
import {HistoryTrend} from '../../ui/HistoryTrend';
import {TransactionChart} from '../../ui/TransactionChart';
import {Choices,ErrorNotice,Field} from './fields';
import {useTheme} from '../../design/ThemeProvider';
import {getMoneyStore} from './localStore';
import {formatMoney,localToday,monthlySummary,validMonth} from './domain';
import {historicalSeries} from './analysisModel';
import {transactionChartRows,transactionCategoryTotals,type ChartKind} from './transactionChartModel';
import type {Snapshot} from './types';
const empty:Snapshot={movements:[],categories:[],budgets:[],schedules:[],commitments:[]};
export default function ChartsScreen({initialMonth,initialView}:{initialMonth?:string;initialView?:string}){
 const {colors}=useTheme(),focused=useIsFocused();
 const [data,setData]=useState(empty),[loaded,setLoaded]=useState(false),[month,setMonth]=useState(validMonth(initialMonth??'')?initialMonth!:localToday().slice(0,7)),[view,setView]=useState(initialView==='summary'?'summary':initialView==='breakdown'?'breakdown':initialView==='trends'?'trends':'transactions'),[count,setCount]=useState('6'),[category,setCategory]=useState('all'),[details,setDetails]=useState(false),[error,setError]=useState(''),[showMonth,setShowMonth]=useState(false),[kind,setKind]=useState<ChartKind>('all'),[breakdownKind,setBreakdownKind]=useState<'income'|'expense'>('expense');
 const load=useCallback(async()=>{const store=await getMoneyStore();setData(await store.snapshot());setLoaded(true);},[]);
 useEffect(()=>{if(!focused)return;const refresh=()=>void load().catch(()=>setError('No pudimos cargar el análisis cifrado. Vuelve a abrir la sección.'));refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>sub.remove();},[focused,load]);
 const result=useMemo(()=>{try{return {summary:monthlySummary(data,month),trend:historicalSeries(data,month,Number(count),category),transactions:transactionChartRows(data.movements,data.categories,month,kind,category),breakdown:transactionCategoryTotals(data.movements,data.categories,month,breakdownKind),error:''};}catch{return {summary:null,trend:[],transactions:[],breakdown:[],error:'Elige un mes válido (AAAA-MM). No se calcularon cifras con un período inválido.'};}},[data,month,count,category,kind,breakdownKind]);
 const summary=result.summary,categoryName=category==='all'?undefined:category==='uncategorized'?'Gastos sin categoría':category==='income-uncategorized'?'Ingresos sin categoría':data.categories.find(c=>c.id===category)?.name??'Categoría';
 const categories=[['all','Todas las categorías'],...data.categories.map(c=>[c.id,`${c.kind==='income'?'Ingreso':'Gasto'} · ${c.name}${c.archived?' (archivada)':''}`] as const),['uncategorized','Gastos sin categoría'],['income-uncategorized','Ingresos sin categoría']] as const;
 return <Screen title="Ingresos y gastos" demo={false}><ErrorNotice message={error||result.error}/><Pressable accessibilityRole="button" accessibilityLabel="Abrir Deudas y mis facturas" onPress={()=>router.push('/debts')} style={{minHeight:44,alignSelf:'flex-end',flexDirection:'row',gap:6,alignItems:'center',paddingHorizontal:10}}><Ionicons name="card-outline" size={22} color={colors.primary}/><Body>Deudas y mis facturas</Body></Pressable>
 <Choices compact label="Vista del análisis" presentation="tabs" small value={view} onChange={setView} options={[["summary","Resumen"],["transactions","Cada movimiento"],["trends","Tendencias mensuales"],["breakdown","Desglose mensual"]]}/>
 <Pressable accessibilityRole="button" onPress={()=>setShowMonth(!showMonth)} style={{minHeight:44,flexDirection:'row',gap:8,alignItems:'center',alignSelf:'flex-end',paddingHorizontal:12,borderRadius:12,backgroundColor:colors.surface}}><Ionicons name="calendar-outline" size={18} color={colors.primary}/><Body style={{fontSize:13}}>Mes: {month}</Body><Ionicons name="chevron-down" size={15} color={colors.primary}/></Pressable>{showMonth?<Field label="Mes de referencia (AAAA-MM)" value={month} onChangeText={setMonth}/>:null}
 {!loaded?<ActivityIndicator accessibilityLabel="Cargando análisis local"/>:null}
 {summary&&view==='summary'?<Card chart><MonthlyCharts compact initialIndividual={false} summary={summary} movements={data.movements} categories={data.categories} month={month}/></Card>:null}
 {summary&&view==='transactions'?<>
 <Choices compact small presentation="tabs" label="Tipo de movimiento" value={kind} onChange={value=>{setKind(value as ChartKind);setCategory('all');}} options={[["all","Ambos"],["income","Ingresos"],["expense","Gastos"]]}/>
 <Choices compact label="Categoría de las transacciones" value={category} onChange={setCategory} options={categories.filter(([id])=>id==='all'||kind==='all'||id===(kind==='income'?'income-uncategorized':'uncategorized')||data.categories.some(c=>c.id===id&&c.kind===kind))}/>
 <Card chart><Body style={{fontSize:20,fontWeight:'800'}}>Cada ingreso y gasto · {month}</Body><TransactionChart key={`${month}:${kind}:${category}`} rows={result.transactions}/></Card></>:null}
 {summary&&view==='trends'?<>
 <Choices compact label="Comparar" presentation="tabs" small value={count} onChange={setCount} options={[["6","Últimos 6 meses"],["12","Últimos 12 meses"]]}/><Choices compact label="Analizar categoría" value={category} onChange={v=>{setCategory(v);setDetails(false);setKind('all');}} options={categories}/>
 <Card chart><Body style={{fontWeight:'800',fontSize:20}}>{categoryName?`Evolución de ${categoryName}`:'Evolución de ingresos y gastos'}</Body><HistoryTrend compact rows={result.trend} categoryName={categoryName}/></Card>
 {category!=='all'?<><ActionButton title={details?'Ocultar movimientos individuales':'Ver movimientos individuales del mes'} secondary onPress={()=>setDetails(!details)}/>{details?<Card chart><TransactionChart key={`${month}:${category}`} rows={transactionChartRows(data.movements,data.categories,month,'all',category)}/></Card>:null}</>:null}</>:null}
 {summary&&view==='breakdown'?<>
 <Choices compact small presentation="tabs" label="Desglose de categorías" value={breakdownKind} onChange={v=>setBreakdownKind(v as 'income'|'expense')} options={[["expense","Gastos"],["income","Ingresos"]]}/>
 <Card chart><Body style={{fontWeight:'800',fontSize:21}}>Categorías de {breakdownKind==='income'?'ingresos':'gastos'} · {month}</Body><ExpenseDonut legend={false} label={breakdownKind==='income'?'Ingresos':'Gastos'} items={result.breakdown} total={breakdownKind==='income'?summary.income:summary.expenses}/>
 {result.breakdown.map(c=><Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Ver ${c.count} transacciones de ${c.name}: ${formatMoney(c.spent)}`} onPress={()=>{setCategory(c.id);setKind(breakdownKind);setView('transactions');}} style={{minHeight:56,flexDirection:'row',gap:12,alignItems:'center',borderBottomWidth:1,borderColor:colors.line,paddingVertical:10}}><View style={{width:32,height:32,borderRadius:9,backgroundColor:categoryAppearance(c.id,c.name).color,alignItems:'center',justifyContent:'center'}}><Ionicons name={categoryAppearance(c.id,c.name).icon} size={20} color="#FFFFFF"/></View><View style={{flex:1}}><Body>{c.name}{c.archived?' (archivada)':''}</Body><Body muted style={{fontSize:12}}>{c.count} transacción(es)</Body></View><Body style={{fontWeight:'700'}}>{formatMoney(c.spent)}</Body><Ionicons name="chevron-forward" size={20} color={colors.accent}/></Pressable>)}
 <Body muted>Toca una categoría para ver cada transacción. Su evolución está en Tendencias mensuales.</Body></Card></>:null}
 <View style={{gap:10}}><ActionButton title="Categorías y presupuestos" icon="options-outline" secondary onPress={()=>router.push({pathname:'/money',params:{section:'categories',month:validMonth(month)?month:localToday().slice(0,7)}})}/><ActionButton title="Transacciones mensuales" icon="list-outline" secondary onPress={()=>router.push({pathname:'/money',params:{section:'history',month:validMonth(month)?month:localToday().slice(0,7)}})}/></View></Screen>;
}
