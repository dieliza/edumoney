import {View} from 'react-native';
import {Body} from '../../ui/components';
import {Field,Choices} from '../money/fields';
import {parseAmount} from '../../core/money';
import {type DeductionRule} from './calculation';
const amount=(n:number|null)=>n===null?'':(n/100).toFixed(2);
const parsed=(s:string)=>s.trim()?parseAmount(s):null;
export function DeductionRuleEditor({rule,onChange,services=false,configuration=false}:{rule:DeductionRule;onChange:(r:DeductionRule)=>void;services?:boolean;configuration?:boolean}){
 const update=(change:Partial<DeductionRule>)=>onChange({...rule,...change});
 return <View style={{gap:8}}>
  <Choices label="Cálculo de la deducción" presentation="tabs" value={rule.mode} options={[[ 'fixed','Importe fijo'],['percentage','Porcentajes (%)']]} onChange={mode=>update({mode})}/>
  {configuration?<Choices label="Estado de la regla" value={rule.active?'yes':'no'} options={[[ 'yes','Activa'],['no','Desactivada']]} onChange={v=>update({active:v==='yes'})}/>:null}
  {rule.mode==='fixed'?<Field label="Importe fijo (USD)" decimal value={amount(rule.fixedCents)} onChangeText={v=>update({fixedCents:parsed(v)})} required={rule.active}/>:<>
   <View style={{flexDirection:'row',alignItems:'center'}}><View style={{flex:1}}><Field label="Porcentaje" money={false} decimal required={rule.active} calculationRequired={false} value={rule.percentage} onChangeText={percentage=>update({percentage})}/></View><Body>%</Body></View>
   <Choices label="Base de cálculo" value={rule.base} options={[[ 'gross','Ingreso bruto'],['adjusted','Base ajustada'],['custom','Base personalizada definida'],...(services?[[ 'threshold','Servicios PR: umbral por pagador y año'] as const]:[])]} onChange={base=>update({base})}/>
   {rule.base==='adjusted'||rule.base==='custom'?<><Field label="Base definida (USD)" decimal value={amount(rule.baseCents)} onChangeText={v=>update({baseCents:parsed(v)})} required={rule.active}/><Field label="Cómo se obtiene esta base" value={rule.definition} onChangeText={definition=>update({definition})} required={rule.active} maxLength={240}/></>:null}
   {rule.base==='threshold'?<><Body>Esta regla la defines tú; no establece una tasa ni certifica una exención. El acumulado se separa por pagador legal y año natural. Usa el mismo nombre legal en el cheque y la regla; identifica por separado clientes distintos.</Body><Field label="Pagador legal o cliente" required={rule.active} value={rule.payer} onChangeText={payer=>update({payer})} maxLength={240}/><Field label="Año natural" required={rule.active} calculationRequired={false} value={rule.year} onChangeText={year=>update({year})} maxLength={4}/><Field label="Umbral exento (USD)" required={rule.active} decimal value={amount(rule.thresholdCents)} onChangeText={v=>update({thresholdCents:parsed(v)})}/><Field label="Acumulado previo no registrado en esta app (USD)" required={rule.active} decimal value={amount(rule.openingCents)} onChangeText={v=>update({openingCents:parsed(v)})}/><Body muted>Escribe 0 si no hubo pagos anteriores fuera de la app. Se suman los brutos ya registrados de ese pagador y año hasta la fecha de este pago, sin incluir este cheque. Evita incluirlos otra vez en el acumulado manual. Cambiar pagos anteriores no recalcula los posteriores: revísalos por separado.</Body></>:null}
  </>}
  {configuration?<Field label="Descripción de la regla (opcional)" value={rule.description??''} onChangeText={description=>update({description})} maxLength={240}/>:null}
 </View>;
}
