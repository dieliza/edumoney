import {useAccountScope} from './accountScope';
import {MonthControl,monthLabel} from '../../ui/MonthControl';
import {useCallback,useEffect,useMemo,useRef,useState} from 'react';
import {ActivityIndicator,AppState,Pressable,View} from 'react-native';
import {useIsFocused,useLocalSearchParams} from 'expo-router';
import {Body,Card,Screen} from '../../ui/components';
import {TransactionOverview} from '../../ui/TransactionOverview';
import {commercialHomeOverview} from '../../ui/commercialHomeOverview';
import {HistoryTrend} from '../../ui/HistoryTrend';
import {Choices,ErrorNotice} from './fields';
import {useTheme} from '../../design/ThemeProvider';
import {BusinessLedgerStore} from '../business/ledgerStore';
import type {BusinessLedgerSnapshot} from '../business/ledgerTypes';
import {getMoneyStore} from './localStore';
import {localToday,monthlySummary,validMonth} from './domain';
import {historicalSeries} from './analysisModel';
import type {Snapshot} from './types';
const empty:Snapshot={movements:[],categories:[],budgets:[],schedules:[],commitments:[]};
export default function ChartsScreen({initialMonth,initialView}:{initialMonth?:string;initialView?:string}){
 const activeAccount=useAccountScope();
 const params=useLocalSearchParams<{account?:string}>(),commercial=params.account?params.account==='commercial':activeAccount==='business',focused=useIsFocused(),{name,colors}=useTheme();
 const request=useRef(0);const [scope,setScope]=useState<boolean|null>(null);
 const [data,setData]=useState(empty),[business,setBusiness]=useState<BusinessLedgerSnapshot|null>(null),[loaded,setLoaded]=useState(false),[month,setMonth]=useState(validMonth(initialMonth??'')?initialMonth!:localToday().slice(0,7)),[trends,setTrends]=useState(initialView==='trends'),[count,setCount]=useState('6'),[error,setError]=useState(''),[showMonth,setShowMonth]=useState(false);
 const load=useCallback(async()=>{const ticket=++request.current;const store=await getMoneyStore();const next=await store.snapshot(!commercial);const nextBusiness=commercial?await new BusinessLedgerStore(store).snapshot():null;if(ticket!==request.current)return;setData(next);setBusiness(nextBusiness);setScope(commercial);setError('');setLoaded(true);},[commercial]);
 const cancel=useCallback(()=>{request.current++;},[]);
 useEffect(()=>{if(!focused)return;let live=true;const refresh=()=>{void load().catch(()=>{if(live){setError('No pudimos cargar las transacciones. Vuelve a abrir la sección.');setLoaded(false);}});};refresh();const sub=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>{live=false;cancel();sub.remove();};},[focused,load,cancel]);
 const result=useMemo(()=>{if(!loaded||scope!==commercial||!validMonth(month)||commercial&&!business)return null;const selected=commercial?commercialHomeOverview(business!,data.categories,month):{summary:monthlySummary(data,month),movements:data.movements,categories:data.categories};const trendData=commercial?{...empty,categories:data.categories,movements:[...new Set(business!.movements.map(m=>m.date.slice(0,7)))].flatMap(period=>commercialHomeOverview(business!,data.categories,period).movements)}:data;return {...selected,trend:historicalSeries(trendData,month,Number(count),'all')};},[loaded,scope,month,commercial,business,data,count]);
 return <Screen title={`Transacciones · ${commercial?'Comercial':'Personal'}`} demo={false}><ErrorNotice message={error}/><View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}><Pressable accessibilityRole="button" accessibilityState={{selected:trends}} onPress={()=>setTrends(!trends)} style={{minHeight:44,padding:10,borderRadius:12,backgroundColor:trends?'#7046AE':'#00774F'}}><Body style={{color:'#FFFFFF',fontWeight:'800'}}>{trends?'Ver gráficas':'Tendencias mensuales'}</Body></Pressable><Pressable accessibilityRole="button" onPress={()=>setShowMonth(!showMonth)} style={{minHeight:44,padding:10,borderRadius:12,borderWidth:1,borderColor:colors.line}}><Body canvas={name==='dark'}>Mes: {monthLabel(month)}</Body></Pressable></View>{showMonth?<MonthControl value={month} onChange={setMonth}/>:null}{!validMonth(month)?<ErrorNotice message="Elige un mes válido (AAAA-MM)."/>:null}{!loaded&&!error?<ActivityIndicator accessibilityLabel="Cargando transacciones"/>:null}
 {result?(trends?<><Choices compact presentation="tabs" label="Comparar" value={count} onChange={setCount} options={[[ '6','Últimos 6 meses'],['12','Últimos 12 meses']]}/><Card chart><HistoryTrend compact rows={result.trend}/></Card></>:<TransactionOverview summary={result.summary} movements={result.movements} categories={result.categories} month={month}/>):null}</Screen>;
}
