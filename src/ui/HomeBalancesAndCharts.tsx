import {FundsSummary,fundsAsOf} from './FundsSummary';
import {useFunds} from '../modules/funds/useFunds';
import {fundSummary} from '../modules/funds/domain';
import type {FundsSummary as FundsProjection} from '../modules/funds/types';
import {useAccountScope,setAccountScope} from '../modules/money/accountScope';
import {useEffect,useState} from 'react';
import {Pressable,View,useWindowDimensions} from 'react-native';
import {Body} from './components';
import {ExpenseTopThree} from './ExpenseTopThree';
import {router} from 'expo-router';
import {useTheme} from '../design/ThemeProvider';
import {monthlySummary,localToday} from '../modules/money/domain';
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
type Account='personal'|'commercial';
export function HomeBalanceView({summary,month,movements=[],categories=[],commercial,error='',account='personal',onAccountChange,fundsSummary=null,fundsError='',asOf=localToday()}:Props&{commercial:Commercial|null;error?:string;account?:Account;fundsSummary?:FundsProjection|null;fundsError?:string;asOf?:string;onAccountChange?(account:Account):void}){
 const {colors}=useTheme(),{width}=useWindowDimensions();
 const isPersonal=account==='personal',label=isPersonal?'Personal':'Comercial';
 return <View style={{gap:16}}>
  <FundsSummary summary={fundsSummary} scope={account==='commercial'?'business':'personal'} error={fundsError} asOf={asOf}/>
  <View testID="home-account-controls" style={{flexDirection:'row',alignItems:'stretch',gap:8}}>
   <View accessibilityRole="tablist" accessibilityLabel="Cuenta del resumen" style={{flex:2,flexDirection:'row',gap:8}}>
    {([['personal','Personal','#00774F'],['commercial','Comercial','#7046AE']] as const).map(([value,title,color])=><Pressable key={value} testID={`home-account-${value}`} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{selected:account===value}} onPress={()=>onAccountChange?.(value)} style={{flex:1,minWidth:0,minHeight:44,paddingHorizontal:width<430?8:16,paddingVertical:8,borderRadius:12,borderWidth:account===value?2:1,borderColor:account===value?'#EDFFF2':colors.line,backgroundColor:color,justifyContent:'center',alignItems:'center'}}><Body numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{fontSize:width<430?12:18,fontWeight:'800',color:'#FFFFFF',textAlign:'center'}}>{title}</Body></Pressable>)}
   </View>
   <Pressable testID="home-transactions" accessibilityRole="button" accessibilityLabel={`Transacciones ${label.toLocaleLowerCase('es')}`} onPress={()=>router.push({pathname:'/charts',params:{account,month}})} style={{flex:1,minWidth:0,minHeight:44,paddingHorizontal:8,paddingVertical:8,alignItems:'center',justifyContent:'center',borderRadius:12,borderWidth:1,borderColor:'#FFD36A',backgroundColor:'#FFB600'}}><Body numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65} style={{fontSize:width<430?12:18,color:'#14313B',fontWeight:'800',textAlign:'center'}}>Transacciones</Body></Pressable>
  </View>
 </View>;
}
function useCommercialSummary(props:Props){
 const [result,setResult]=useState<{basis:Summary;month:string;value:Commercial}|null>(null),[failure,setFailure]=useState<{basis:Summary;month:string}|null>(null);
 useEffect(()=>{let live=true;void getMoneyStore().then(async ledger=>{const business=await new BusinessLedgerStore(ledger).snapshot();const money=await ledger.snapshot();return commercialHomeOverview(business,money.categories,props.month);}).then(value=>{if(live){setResult({basis:props.summary,month:props.month,value});setFailure(null);}}).catch(()=>{if(live)setFailure({basis:props.summary,month:props.month});});return()=>{live=false;};},[props.month,props.summary]);
 const current=result?.basis===props.summary&&result.month===props.month?result.value:null,error=failure?.basis===props.summary&&failure.month===props.month?'No pudimos cargar el resumen comercial. Vuelve a abrir Home.':'';
 return {current,error};
}
export function AccountExpenseTopThree(props:Props&{onOpen():void}){
 const scope=useAccountScope(),{current}=useCommercialSummary(props);
 return <ExpenseTopThree items={scope==='business'?(current?.summary.distribution??[]):props.summary.distribution} month={props.month} onOpen={props.onOpen}/>;
}
export function HomeBalancesAndCharts(props:Props){
 const scope=useAccountScope(),account:Account=scope==='business'?'commercial':'personal';
 const setAccount=(value:Account)=>setAccountScope(value==='commercial'?'business':'personal');
 const {current,error}=useCommercialSummary(props);
 const funds=useFunds(),asOf=fundsAsOf(props.month,localToday());let projection:FundsProjection|null=null;let failure=funds.error;try{if(funds.data)projection=fundSummary(funds.data,scope,asOf);}catch{failure='No pudimos calcular los fondos. Revisa los importes guardados.';}
 return <HomeBalanceView fundsSummary={projection} fundsError={failure} asOf={asOf} {...props} account={account} onAccountChange={setAccount} commercial={error?null:current} error={error}/>;
}
