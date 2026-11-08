import { useState } from 'react';
import { newId } from '../../core/id';
import { userMessage } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { ActionButton, Body, Card } from '../../ui/components';
import { formatMoney, inputAmount, localToday } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { paymentLabels, type PaymentMethod, type LedgerMovement } from '../money/types';
import { outstanding } from './domain';
import { SimilarBillPaymentError, type BillsStore } from './store';
import type { Bill } from './types';
export function PaymentForm({bill,store,movements,close,saved}:{bill:Bill;store:BillsStore;movements:LedgerMovement[];close():void;saved():Promise<void>}){
 const [id]=useState(newId);const [amount,setAmount]=useState(inputAmount(outstanding(bill)));const [date,setDate]=useState(localToday());
 const [method,setMethod]=useState<PaymentMethod>('bank');const [existing,setExisting]=useState('new');
 const [similar,setSimilar]=useState(false);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const candidates=movements.filter(m=>!m.deletedAt && m.kind===bill.paymentKind).slice(0,100);
 async function save(confirmSimilar=false){if(busy)return;setBusy(true);setError('');try{
  await store.pay({id,billId:bill.id,expectedVersion:bill.version,amountCents:parseAmount(amount.trim()),date:date.trim(),paymentMethod:method,existingMovementId:existing==='new'?null:existing,confirmSimilar});
  await saved();close();
 }catch(e){setError(userMessage(e));setSimilar(e instanceof SimilarBillPaymentError);}finally{setBusy(false);}}
 return <Sheet title="Confirmar pago" close={close} busy={busy}>
  <Body style={{fontWeight:'700'}}>{bill.provider} · Pendiente {formatMoney(outstanding(bill))}</Body>
  <Body>Confirma únicamente dinero que ya pagaste. Puedes pagar parte del importe; el resto seguirá pendiente.</Body>
  <Field label="Importe pagado (USD)" testID="bill-paid-amount" value={amount} onChangeText={v=>{setAmount(v);setSimilar(false);}} decimal/>
  <Field label="Fecha del pago (AAAA-MM-DD)" testID="bill-paid-date" value={date} onChangeText={v=>{setDate(v);setSimilar(false);}}/>
  <Choices label="Método del pago" value={method} options={Object.entries(paymentLabels).filter(([key])=>bill.paymentKind==='expense' || key!=='credit') as [PaymentMethod,string][]} onChange={v=>{setMethod(v);setSimilar(false);}}/>
  <Choices label="Movimiento del pago" value={existing} options={[[ 'new','Crear un movimiento'],...candidates.map(m=>[m.id,`${m.description} · ${formatMoney(m.amountCents)} · ${m.date}`] as const)]} onChange={v=>{
   setExisting(v);setSimilar(false);const m=candidates.find(row=>row.id===v);if(m){setAmount(inputAmount(m.amountCents));setDate(m.date);setMethod(m.paymentMethod as PaymentMethod);}
  }}/>
  <Body muted>{existing==='new'?'Se creará un solo movimiento vinculado a esta factura.':'Se conservará el movimiento elegido, sin sumar otro. Debe coincidir exactamente con los datos de pago.'} Se muestran hasta 100 movimientos recientes; puedes buscarlos primero en Mi dinero.</Body>
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Confirmar pago registrado" testID="bill-confirm-payment" onPress={()=>void save()}/>:null}
  {similar && !busy?<Card><Body>Revisa el movimiento coincidente antes de continuar. Si son dos pagos distintos, confirma expresamente.</Body><ActionButton title="Confirmo que es otro pago distinto" secondary onPress={()=>void save(true)}/></Card>:null}
 </Sheet>;
}
