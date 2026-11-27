import {addAmounts,cents} from '../core/money';
import {MeaningHelp} from './MeaningHelp';
import {Pressable,View,useWindowDimensions} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {router} from 'expo-router';
import {Body} from './components';
import type {AccountScope} from '../modules/money/accountScope';
import type {FundsSummary as Summary} from '../modules/funds/types';
import {formatMoney,validMonth} from '../modules/money/domain';
export function fundsAsOf(month:string,today:string){if(!validMonth(month)||month>=today.slice(0,7))return today;const [year,m]=month.split('-').map(Number);return new Date(Date.UTC(year,m,0)).toISOString().slice(0,10);}
export function FundsSummary({summary,scope,error='',asOf}:{summary:Summary|null;scope:AccountScope;error?:string;asOf:string}){
 const {width}=useWindowDimensions(),small=width<400;const goalSavings=summary?addAmounts(...summary.funds.filter(f=>f.goalId&&f.kind==='savings').map(f=>cents(f.balanceCents))):0,goalEmergency=summary?addAmounts(...summary.funds.filter(f=>f.goalId&&f.kind==='emergency').map(f=>cents(f.balanceCents))):0;const goals=summary?addAmounts(...summary.funds.filter(f=>f.goalId).map(f=>cents(f.balanceCents))):null;
 const open=(kind:string)=>kind==='goals'?router.push('/goals'):router.push({pathname:'/funds',params:{scope,kind,asOf}}),amount=(n:number|undefined)=>n===undefined?'…':formatMoney(n);
 return <LinearGradient testID="funds-summary-card" colors={['#008449','#006E4B','#034343']} start={{x:0,y:0}} end={{x:1,y:1}} style={{borderRadius:24,padding:small?14:20,borderWidth:2,borderColor:'#17E98D',gap:18}}>
 <Body style={{fontSize:small?23:27,lineHeight:32,fontWeight:'800',color:'#FFFFFF',textAlign:'center'}}>Resumen de tu dinero</Body>
 <MeaningHelp canvas inverse label="Resumen de tu dinero"/><Body style={{fontWeight:'700',fontSize:14,color:'#DEFFEC'}}>{scope==='personal'?'Personal':'Comercial'}</Body>
 <View style={{flexDirection:'row',gap:12,alignItems:'stretch'}}>
 <Pressable testID={`home-${scope==='business'?'commercial':'personal'}-balance`} accessibilityRole="button" accessibilityLabel="Administrar balance disponible" onPress={()=>open('available')} style={{flex:1,minWidth:0,minHeight:86,gap:5,justifyContent:'center'}}><Body style={{color:'#FFFFFF',fontWeight:'800',fontSize:small?15:18}}>Balance disponible</Body><Body adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={{fontWeight:'800',fontSize:small?29:38,lineHeight:46,color:'#FFFFFF'}}>{amount(summary?.available)}</Body></Pressable>
 <Pressable accessibilityRole="button" accessibilityLabel="Consultar total de fondos" onPress={()=>open('all')} style={{flex:1,minWidth:0,minHeight:86,padding:10,borderRadius:20,borderWidth:1.5,borderColor:'#1DE79C',backgroundColor:'rgba(0,45,45,.35)',alignItems:'center',justifyContent:'center',gap:6}}><Body style={{color:'#FFF16D',fontWeight:'800',fontSize:small?15:18,textAlign:'center'}}>Total de fondos</Body><Body adjustsFontSizeToFit minimumFontScale={0.6} numberOfLines={1} style={{fontWeight:'800',fontSize:small?27:34,lineHeight:40,color:'#FFF16D'}}>{amount(summary?.total)}</Body></Pressable>
 </View>
 <View style={{flexDirection:'row',flexWrap:scope==='personal'?'wrap':'nowrap',gap:8}}>{([{kind:'savings',title:'Ahorros',colors:['#007D72','#005E65'],value:summary?summary.savings-goalSavings:undefined},{kind:'emergency',title:'Fondo de emergencia',colors:['#007A9E','#005A80'],value:summary?summary.emergency-goalEmergency:undefined},{kind:'budget',title:'Presupuesto mensual',colors:['#7544AA','#4C2E78'],value:summary?.budget},...(scope==='personal'?[{kind:'goals',title:'Mis metas',colors:['#246EBB','#164378'] as const,value:goals??undefined}]:[])] as const).map(item=><Pressable key={item.kind} testID={`home-fund-${item.kind}`} accessibilityRole="button" accessibilityLabel={`Administrar ${item.title}`} onPress={()=>open(item.kind)} style={{flexGrow:1,flexBasis:scope==='personal'?(width<600?'47%':'23%'):undefined,flex:scope==='personal'?undefined:1,minWidth:0}}><LinearGradient colors={item.colors} style={{minHeight:small?112:126,borderRadius:18,paddingHorizontal:5,paddingVertical:12,alignItems:'center',justifyContent:'space-between',gap:8}}><Body style={{fontWeight:'800',fontSize:small?13:16,lineHeight:21,color:'#FFFFFF',textAlign:'center'}}>{item.title}</Body><Body adjustsFontSizeToFit minimumFontScale={0.55} numberOfLines={1} style={{fontWeight:'800',fontSize:small?20:27,lineHeight:34,color:'#FFFFFF'}}>{amount(item.value)}</Body></LinearGradient></Pressable>)}</View>
 {scope==='personal'?<Body style={{fontSize:13,color:'#FFFFFF'}}>El Total incluye el balance disponible, los fondos y las metas.</Body>:null}
 <Body style={{fontSize:12,lineHeight:18,color:'#E2FFEE'}}>Balance estimado según tus registros · No es un balance bancario confirmado. Fondos al {asOf}.</Body>{error?<Body style={{color:'#FFF3B0',fontSize:14}}>{error}</Body>:null}
 </LinearGradient>;
}
