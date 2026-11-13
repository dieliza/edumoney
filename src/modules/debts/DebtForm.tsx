import { useState } from 'react';
import { newId } from '../../core/id';
import { userMessage } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { ActionButton, Body } from '../../ui/components';
import { inputAmount, localToday } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { parseRate } from './domain';
import { debtLabels, type Debt, type DebtInput, type DebtKind } from './types';
import type { DebtStore } from './store';
export function DebtForm({initial,store,saved,close}:{initial?:Debt;store:DebtStore;saved():Promise<void>;close():void}){
 const [id]=useState(()=>initial?.id??newId());const [name,setName]=useState(initial?.name??'');const [kind,setKind]=useState<DebtKind>(initial?.kind??'credit_card');
 const [balance,setBalance]=useState(initial?inputAmount(initial.balanceCents):'');const [date,setDate]=useState(initial?.balanceAsOf??localToday());
 const [rate,setRate]=useState(initial?.annualRateBps===null||initial?.annualRateBps===undefined?'':inputAmount(initial.annualRateBps));
 const [minimum,setMinimum]=useState(initial?.minimumCents===null||initial?.minimumCents===undefined?'':inputAmount(initial.minimumCents));
 const [due,setDue]=useState(initial?.dueDate??'');const [closing,setClosing]=useState(initial?.closingDate??'');
 const [fees,setFees]=useState(initial?.feesCents===null||initial?.feesCents===undefined?'':inputAmount(initial.feesCents));
 const [futureRate,setFutureRate]=useState(initial?.futureRateBps===null||initial?.futureRateBps===undefined?'':inputAmount(initial.futureRateBps));const [changeDate,setChangeDate]=useState(initial?.rateChangeDate??'');
 const [advanced,setAdvanced]=useState(false);const [reconcile,setReconcile]=useState('no');const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(){if(busy)return;setBusy(true);setError('');try{
  const d:DebtInput={id,name,kind,balanceCents:parseAmount(balance.trim()),balanceAsOf:date.trim()||null,annualRateBps:rate.trim()?parseRate(rate):null,minimumCents:minimum.trim()?parseAmount(minimum.trim()):null,dueDate:due.trim()||null,closingDate:closing.trim()||null,feesCents:fees.trim()?parseAmount(fees.trim()):null,futureRateBps:futureRate.trim()?parseRate(futureRate):null,rateChangeDate:changeDate.trim()||null};
  if(initial)await store.edit(d,initial.version,reason,reconcile==='yes');else await store.create(d);await saved();close();
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title={initial?'Actualizar deuda':'Añadir deuda'} close={close} busy={busy}>
  <Field label="Nombre de la deuda" testID="debt-name" value={name} onChangeText={setName}/>
  <Field label="Saldo total pendiente (USD)" testID="debt-balance" value={balance} onChangeText={setBalance} decimal/>
  <Field label="Fecha del saldo base (AAAA-MM-DD)" testID="debt-base-date" value={date} onChangeText={setDate}/>
  <Field label="Tasa anual APR (%, vacío si no la conoces)" testID="debt-rate" value={rate} onChangeText={setRate} decimal/>
  <Field label="Pago mínimo mensual (USD, opcional)" testID="debt-minimum" value={minimum} onChangeText={setMinimum} decimal/>
  <Field label="Próximo vencimiento (AAAA-MM-DD, opcional)" testID="debt-due" value={due} onChangeText={setDue}/>
  <Body muted>El saldo total debe incluir los intereses y cargos ya facturados. Los pagos posteriores lo ajustan; no añadimos intereses reales automáticamente. Un campo vacío significa desconocido; cero significa cero confirmado.</Body>
  <Choices<DebtKind> label="Tipo de deuda" value={kind} options={Object.entries(debtLabels) as [DebtKind,string][]} onChange={setKind}/>
  <ActionButton title={advanced?'Ocultar detalles opcionales':'Mostrar corte, cargos y tasa futura'} secondary onPress={()=>setAdvanced(!advanced)}/>
  {advanced?<><Field label="Fecha de corte (AAAA-MM-DD, opcional)" value={closing} onChangeText={setClosing}/><Field label="Cargos conocidos ya incluidos en el saldo (USD, opcional)" value={fees} onChangeText={setFees} decimal/>
   <Field label="Nueva APR conocida (%, opcional)" value={futureRate} onChangeText={setFutureRate} decimal/><Field required={!!futureRate.trim()} label="Fecha efectiva de la nueva APR (AAAA-MM-DD)" value={changeDate} onChangeText={setChangeDate}/><Body muted>No se predicen tasas. Guarda un cambio futuro solo si lo conoces por tu contrato o aviso de la entidad.</Body></>:null}
  {initial?<><Choices label="¿Es un nuevo saldo confirmado?" value={reconcile} options={[[ 'no','Solo cambiar condiciones'],['yes','Conciliar con nuevo estado']]} onChange={setReconcile}/><Body muted>Conciliar sustituye el saldo registrado por el del nuevo estado, sin volver a descontar pagos antiguos. La fecha debe incluir los pagos registrados. Las facturas preparadas no cambian automáticamente. Un saldo positivo confirmado reactiva una deuda archivada.</Body><Field label="Motivo de actualización de deuda" value={reason} onChangeText={setReason} multiline/></>:null}
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar deuda" testID="debt-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
