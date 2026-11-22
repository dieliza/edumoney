import {useEffect,useState} from 'react';
import {Pressable,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Body} from './components';
import {router} from 'expo-router';
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
type Account='personal'|'commercial';
export function HomeBalanceView({summary,month,movements=[],categories=[],commercial,error='',account='personal',onAccountChange}:Props&{commercial:Commercial|null;error?:string;account?:Account;onAccountChange?(account:Account):void}){
 const {name,colors}=useTheme(),{width}=useWindowDimensions();const ink=name==='dark'?'#F1FFFC':colors.text;
 const isPersonal=account==='personal',label=isPersonal?'Personal':'Comercial';
 const selected=isPersonal?{summary,movements,categories}:commercial;
 return <View style={{gap:16}}>
  <LinearGradient colors={['#0BAE61','#00774F','#034343']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:20,padding:16,borderWidth:1,borderColor:'#44E58B',gap:12}}>
   <Body style={{fontSize:16,fontWeight:'700',color:'#EDFFF2'}}>Saldo disponible estimado</Body>
   <View testID={`home-${account}-balance`} accessible accessibilityLabel={selected?`Disponible ${label.toLocaleLowerCase('es')} estimado: ${formatMoney(selected.summary.available)}`:error||'Cargando disponible comercial'} style={{minWidth:0,gap:5}}>
    <Body style={{fontSize:16,fontWeight:'800',color:'#EDFFF2'}}>{label}</Body>
    <Body style={{fontSize:selected?(width<430?32:34):16,lineHeight:42,fontWeight:'800',color:'#FFFFFF'}}>{selected?formatMoney(selected.summary.available):error?'No disponible':'Cargando…'}</Body>
   </View>
   <Body style={{fontSize:12,lineHeight:18,color:'#E0F8ED'}}>Según tus registros · No es un saldo bancario confirmado</Body>
  </LinearGradient>
  <View accessibilityRole="tablist" accessibilityLabel="Cuenta del resumen" style={{flexDirection:'row',alignItems:'center',gap:12}}>
   {([['personal','Personal'],['commercial','Comercial']] as const).map(([value,title])=><Pressable key={value} testID={`home-account-${value}`} accessibilityRole="tab" accessibilityLabel={title} accessibilityState={{selected:account===value}} onPress={()=>onAccountChange?.(value)} style={{minHeight:44,paddingHorizontal:16,paddingVertical:8,borderRadius:12,borderWidth:1,borderColor:account===value?'#44E58B':colors.line,backgroundColor:account===value?'#00774F':'transparent',justifyContent:'center'}}><Body style={{fontSize:18,fontWeight:'800',color:account===value?'#FFFFFF':ink}}>{title}</Body></Pressable>)}
  </View>
  <Pressable testID="home-transactions" accessibilityRole="button" accessibilityLabel={`Transacciones ${label.toLocaleLowerCase('es')}`} onPress={()=>router.push({pathname:'/charts',params:{account,month}})} style={{alignSelf:'flex-end',minHeight:44,paddingHorizontal:12,justifyContent:'center',borderRadius:12,borderWidth:1,borderColor:colors.line}}><Body style={{color:ink,fontWeight:'700'}}>Transacciones</Body></Pressable>
 </View>;
}
export function HomeBalancesAndCharts(props:Props){
 const [account,setAccount]=useState<Account>('personal');
 const [result,setResult]=useState<{basis:Summary;month:string;value:Commercial}|null>(null),[failure,setFailure]=useState<{basis:Summary;month:string}|null>(null);
 useEffect(()=>{let live=true;void getMoneyStore().then(async ledger=>{const business=await new BusinessLedgerStore(ledger).snapshot();const money=await ledger.snapshot();return commercialHomeOverview(business,money.categories,props.month);}).then(value=>{if(live){setResult({basis:props.summary,month:props.month,value});setFailure(null);}}).catch(()=>{if(live)setFailure({basis:props.summary,month:props.month});});return()=>{live=false;};},[props.month,props.summary]);
 const current=result?.basis===props.summary&&result.month===props.month?result.value:null,error=failure?.basis===props.summary&&failure.month===props.month?'No pudimos cargar el resumen comercial. Vuelve a abrir Home.':'';
 return <HomeBalanceView {...props} account={account} onAccountChange={setAccount} commercial={error?null:current} error={error}/>;
}
