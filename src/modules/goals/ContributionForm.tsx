import { useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { userMessage } from '../../core/errors';
import { Body,ActionButton } from '../../ui/components';
import { Choices,Field,Sheet,ErrorNotice } from '../money/fields';
import { formatMoney,inputAmount,localToday } from '../money/domain';
import type { Goal,GoalSnapshot } from './types';
import type { GoalStore } from './store';
export function ContributionForm({goal,data,store,saved,close}:{goal:Goal;data:GoalSnapshot;store:GoalStore;saved():Promise<unknown>;close():void}){
 const [id]=useState(newId);const [amount,setAmount]=useState('');const [date,setDate]=useState(localToday);const [method,setMethod]=useState('bank');const [existing,setExisting]=useState('');const [confirm,setConfirm]=useState('no');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 const available=data.movements.filter(m=>m.kind==='goal_contribution'&&!m.deletedAt&&!data.contributions.some(c=>!c.reversedAt&&c.movementId===m.id));
 async function save(){if(busy)return;setBusy(true);setError('');try{await store.contribute({id,goalId:goal.id,expectedVersion:goal.version,amountCents:parseAmount(amount),date,paymentMethod:method,existingMovementId:existing||null,confirmSimilar:confirm==='yes'});await saved();close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title={`Aportar a ${goal.name}`} busy={busy} close={close}>
 <Body>Una aportación reserva dinero para la meta; no es un ingreso ni un gasto de compra. Mi dinero la resta una sola vez de su flujo disponible estimado.</Body>
 {available.length?<Choices label="Origen" value={existing} options={[[ '', 'Nueva aportación'],...available.map(m=>[m.id,`${m.date} · ${formatMoney(m.amountCents)} · ${m.description}`] as const)]} onChange={id=>{setExisting(id);const m=available.find(m=>m.id===id);if(m){setAmount(inputAmount(m.amountCents));setDate(m.date);setMethod(m.paymentMethod??'bank');}}}/>:null}
 <Field label="Importe de aportación" testID="goal-contribution-amount" decimal value={amount} onChangeText={setAmount}/>
 <Field label="Fecha de aportación AAAA-MM-DD" value={date} onChangeText={setDate}/>
 <Choices label="Método de aportación" value={method} options={[[ 'bank','Transferencia bancaria'],['cash','Efectivo'],['check','Cheque'],['debit','Tarjeta de débito'],['other','Otro']]} onChange={setMethod}/>
 <Choices label="Si existe otra aportación similar" value={confirm} options={[[ 'no','Revisar antes de duplicar'],['yes','Confirmo que es otra aportación distinta']]} onChange={setConfirm}/><ErrorNotice message={error}/>
 {!busy?<ActionButton title="Guardar aportación" testID="goal-contribution-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
