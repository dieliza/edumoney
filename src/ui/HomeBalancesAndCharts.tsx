import {useEffect,useState} from 'react';
import {View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Body} from './components';
import {MonthlyCharts} from './MonthlyCharts';
import {useTheme} from '../design/ThemeProvider';
import {formatMoney,monthlySummary} from '../modules/money/domain';
import {cents} from '../core/money';
import {commercialAmount} from '../modules/business/ledgerDomain';
import {BusinessLedgerStore} from '../modules/business/ledgerStore';
import {getMoneyStore} from '../modules/money/localStore';
import type {BusinessLedgerSnapshot} from '../modules/business/ledgerTypes';
import type {Category,LedgerMovement} from '../modules/money/types';
type Summary=ReturnType<typeof monthlySummary>;
/** Read-only projection: reuse recorded commercial shares and the existing monthly formula. */
export function commercialHomeOverview(data:BusinessLedgerSnapshot,categories:Category[],month:string){
 const originals=new Map(data.movements.map(m=>[m.id,m]));
 const movements:LedgerMovement[]=data.entries.filter(e=>!e.deletedAt&&!e.stale&&e.date.startsWith(month)).flatMap(e=>{
  const m=originals.get(e.movementId),amount=commercialAmount(e);
  if(!m||m.deletedAt||m.version!==e.movementVersion||m.kind!==e.kind||amount===null||amount<=0)return [];
  // The copy is only for the shared chart model; persisted business classification is untouched.
  return [{...m,amountCents:cents(amount),useKind:'personal' as const}];
 });
 const summary=monthlySummary({movements,categories,budgets:[],schedules:[],commitments:[]},month);
 return {summary,movements,categories};
}
type Commercial=ReturnType<typeof commercialHomeOverview>;
type Props={summary:Summary;month:string;movements?:LedgerMovement[];categories?:Category[]};
export function HomeBalanceView({summary,month,movements=[],categories=[],commercial,error=''}:Props&{commercial:Commercial|null;error?:string}){
 const {name,colors}=useTheme(),{width}=useWindowDimensions();const ink=name==='dark'?'#F1FFFC':colors.text;
 return <View style={{gap:16}}>
  <LinearGradient colors={['#0BAE61','#00774F','#034343']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:20,padding:16,borderWidth:1,borderColor:'#44E58B',gap:12}}>
   <Body style={{fontSize:16,fontWeight:'700',color:'#EDFFF2'}}>Saldo disponible estimado</Body>
   <View style={{flexDirection:'row',alignItems:'stretch'}}>
    <View testID="home-personal-balance" accessible accessibilityLabel={`Disponible personal estimado: ${formatMoney(summary.available)}`} style={{flex:1,minWidth:0,paddingRight:12,gap:5}}><Body style={{fontSize:16,fontWeight:'800',color:'#EDFFF2'}}>Personal</Body><Body style={{fontSize:width<430?25:34,lineHeight:42,fontWeight:'800',color:'#FFFFFF'}}>{formatMoney(summary.available)}</Body></View>
    <View style={{width:1,backgroundColor:'#89E5B5'}}/>
    <View testID="home-commercial-balance" accessible accessibilityLabel={commercial?`Disponible comercial estimado: ${formatMoney(commercial.summary.available)}`:error||'Cargando disponible comercial'} style={{flex:1,minWidth:0,paddingLeft:12,gap:5}}><Body style={{fontSize:16,fontWeight:'800',color:'#EDFFF2'}}>Comercial</Body><Body style={{fontSize:commercial?(width<430?25:34):16,lineHeight:42,fontWeight:'800',color:'#FFFFFF'}}>{commercial?formatMoney(commercial.summary.available):error?'No disponible':'Cargando…'}</Body></View>
   </View>
   <Body style={{fontSize:12,lineHeight:18,color:'#E0F8ED'}}>Según tus registros · No son saldos bancarios confirmados</Body>
  </LinearGradient>
  <View style={{flexDirection:width>=1000?'row':'column',gap:20,alignItems:'stretch'}}>
   <View testID="home-personal-chart" style={{flex:1,minWidth:0,gap:8}}><Body style={{fontSize:20,fontWeight:'800',color:ink}}>Personal</Body><MonthlyCharts key={`personal-${month}`} summary={summary} movements={movements} categories={categories} month={month} compact initialIndividual={false}/></View>
   <View testID="home-commercial-chart" style={{flex:1,minWidth:0,gap:8}}><Body style={{fontSize:20,fontWeight:'800',color:ink}}>Comercial</Body>{commercial?<MonthlyCharts key={`commercial-${month}`} summary={commercial.summary} movements={commercial.movements} categories={commercial.categories} month={month} compact initialIndividual={false}/>:<View accessibilityLiveRegion="polite"><Body style={{color:ink}}>{error||'Cargando ingresos y gastos comerciales…'}</Body></View>}</View>
  </View>
 </View>;
}
export function HomeBalancesAndCharts(props:Props){
 const [result,setResult]=useState<{basis:Summary;month:string;value:Commercial}|null>(null),[failure,setFailure]=useState<{basis:Summary;month:string}|null>(null);
 useEffect(()=>{let live=true;void getMoneyStore().then(async ledger=>{const business=await new BusinessLedgerStore(ledger).snapshot();const money=await ledger.snapshot();return commercialHomeOverview(business,money.categories,props.month);}).then(value=>{if(live){setResult({basis:props.summary,month:props.month,value});setFailure(null);}}).catch(()=>{if(live)setFailure({basis:props.summary,month:props.month});});return()=>{live=false;};},[props.month,props.summary]);
 const current=result?.basis===props.summary&&result.month===props.month?result.value:null,error=failure?.basis===props.summary&&failure.month===props.month?'No pudimos cargar el resumen comercial. Vuelve a abrir Home.':'';
 return <HomeBalanceView {...props} commercial={error?null:current} error={error}/>;
}
