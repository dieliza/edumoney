import { useState } from 'react';
import { newId } from '../../core/id';
import { userMessage, UserInputError } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { ActionButton, Body } from '../../ui/components';
import { inputAmount, formatMoney, localToday } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { paymentLabels, type LedgerMovement, type PaymentMethod } from '../money/types';
import type { Bill } from '../bills/types';
import { minimumRemaining } from './domain';
import { SimilarDebtPaymentError, type DebtStore } from './store';
import type { Debt, DebtPaymentInput } from './types';
export function DebtPaymentForm({debt,initialBill,store,movements,bills,saved,close}:{debt:Debt;initialBill?:Bill;store:DebtStore;movements:LedgerMovement[];bills:Bill[];saved():Promise<void>;close():void}){
 const [id]=useState(newId);const [amount,setAmount]=useState(initialBill?inputAmount(initialBill.amountCents-initialBill.paidCents):minimumRemaining(debt)?inputAmount(minimumRemaining(debt)!):'');
 const [date,setDate]=useState(localToday());const [method,setMethod]=useState<PaymentMethod>('bank');const [effect,setEffect]=useState('');const [cycle,setCycle]=useState(debt.dueDate?'':'none');
 const [existing,setExisting]=useState('new');const [billId,setBillId]=useState(initialBill?.id??(bills.some(b=>b.debtId===debt.id&&!b.voidedAt&&b.amountCents>b.paidCents)?'':'none'));const [advanced,setAdvanced]=useState(false);
 const [principal,setPrincipal]=useState('');const [interest,setInterest]=useState('');const [fees,setFees]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [similar,setSimilar]=useState(false);
 const candidates=movements.filter(m=>m.kind==='debt_payment'&&!m.deletedAt).slice(0,100);
 const pending=bills.filter(b=>!b.voidedAt&&b.paymentKind==='debt_payment'&&b.amountCents>b.paidCents&&(!b.debtId||b.debtId===debt.id));
 async function save(confirmSimilar=false){if(busy)return;setBusy(true);setError('');try{
  if(!effect||!cycle||!billId)throw new UserInputError('Confirma el efecto sobre el saldo, el vencimiento y si atiende una factura.');
  const b=pending.find(row=>row.id===billId);const optional=(text:string)=>text.trim()?parseAmount(text.trim()):null;
  const p:DebtPaymentInput={id,debtId:debt.id,expectedVersion:debt.version,amountCents:parseAmount(amount.trim()),date:date.trim(),paymentMethod:method,principalCents:optional(principal),interestCents:optional(interest),feesCents:optional(fees),applyToBalance:effect==='reduce',cycleDueDate:cycle==='current'?debt.dueDate:null,existingMovementId:existing==='new'?null:existing,confirmSimilar,billId:billId==='none'?null:billId,expectedBillVersion:b?.version??null};
  await store.pay(p);await saved();close();
 }catch(e){setError(userMessage(e));setSimilar(e instanceof SimilarDebtPaymentError);}finally{setBusy(false);}}
 return <Sheet title="Confirmar pago de deuda" close={close} busy={busy}>
  <Body style={{fontWeight:'700'}}>{debt.name} · Saldo registrado: {formatMoney(debt.balanceCents)}</Body>
  <Field label="Importe del pago de deuda (USD)" testID="debt-paid-amount" value={amount} onChangeText={setAmount} decimal/>
  <Field label="Fecha del pago de deuda (AAAA-MM-DD)" value={date} onChangeText={setDate}/>
  <Choices label="Efecto sobre el saldo mostrado" value={effect} options={[[ 'reduce','Este pago aún reduce el saldo'],['included','Ya está incluido en el saldo base']]} onChange={setEffect}/>
  <Body muted>Fecha del saldo base: {debt.balanceAsOf??'sin confirmar'}. Un pago anterior al estado no se vuelve a descontar. Registrar un pago no realiza un envío de dinero.</Body>
  <Choices label="Vencimiento que atiende este pago" value={cycle} options={debt.dueDate?[[ 'current',`Corresponde al vencimiento ${debt.dueDate}`],['none','Sin asignar a este vencimiento']]:[[ 'none','Vencimiento sin confirmar']]} onChange={setCycle}/>
  <Choices<PaymentMethod> label="Método del pago de deuda" value={method} options={Object.entries(paymentLabels).filter(([key])=>key!=='credit') as [PaymentMethod,string][]} onChange={setMethod}/>
  <Choices label="Movimiento para la deuda" value={existing} options={[[ 'new','Crear un movimiento de pago'],...candidates.map(m=>[m.id,`${m.description} · ${formatMoney(m.amountCents)} · ${m.date}`] as const)]} onChange={v=>{setExisting(v);const m=candidates.find(row=>row.id===v);if(m){setAmount(inputAmount(m.amountCents));setDate(m.date);setMethod(m.paymentMethod as PaymentMethod);}}}/>
  <Choices label="Factura que también se atiende" value={billId} options={[[ 'none','Solo asignar a la deuda'],...pending.map(b=>[b.id,`${b.provider} · ${b.dueDate} · pendiente ${formatMoney(b.amountCents-b.paidCents)}`] as const)]} onChange={setBillId}/>
  <Body muted>Si eliges una factura pendiente, se vincula el mismo movimiento y se reduce su pendiente. Si el movimiento ya procede de una factura pagada, elige Solo asignar a la deuda.</Body>
  <ActionButton title={advanced?'Ocultar desglose':'Añadir desglose conocido'} secondary onPress={()=>setAdvanced(!advanced)}/>
  {advanced?<><Field label="Principal confirmado (USD, opcional)" value={principal} onChangeText={setPrincipal} decimal/><Field label="Intereses confirmados (USD, opcional)" value={interest} onChangeText={setInterest} decimal/><Field label="Cargos confirmados (USD, opcional)" value={fees} onChangeText={setFees} decimal/><Body muted>Los campos vacíos siguen desconocidos. Si completas los tres, deben sumar el pago. No se infiere que todo el importe sea principal.</Body></>:null}
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Confirmar pago de deuda registrado" testID="debt-confirm-payment" onPress={()=>void save()}/>:null}
  {similar&&!busy?<ActionButton title="Confirmo que es otro pago de deuda distinto" secondary onPress={()=>void save(true)}/>:null}
 </Sheet>;
}
