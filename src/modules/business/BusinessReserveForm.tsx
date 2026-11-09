import { useState } from 'react';
import { parseAmount } from '../../core/money';
import { userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../money/fields';
import { decimal } from '../tax/domain';
import { reserveLabels } from './ledgerDomain';
import type { Reserve,ReserveKind } from './ledgerTypes';
import type { BusinessLedgerStore } from './ledgerStore';
export function BusinessReserveForm({holderId,reserves,store,done,close}:{holderId:string;reserves:Reserve[];store:BusinessLedgerStore;done():Promise<void>;close():void}){
 const [kind,setKind]=useState<ReserveKind>('tax');
 const [amount,setAmount]=useState(()=>{const r=reserves.find(r=>r.kind==='tax');return r?decimal(r.amountCents):'';});
 const [note,setNote]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function save(){if(busy)return;setBusy(true);setError('');try{await store.reserve(holderId,kind,parseAmount(amount.trim()),note,reserves.find(r=>r.kind===kind)?.version??0);await done();close();}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title="Reservas manuales del titular" close={close} busy={busy}>
  <Body>Registra cuánto decides mantener reservado para cada obligación. Cambiar una reserva no crea un gasto, no mueve dinero y no confirma fondos disponibles en el banco.</Body>
  <Choices<ReserveKind> label="Tipo de reserva" value={kind} options={Object.entries(reserveLabels) as [ReserveKind,string][]} onChange={k=>{setKind(k);const r=reserves.find(r=>r.kind===k);setAmount(r?decimal(r.amountCents):'');setNote('');}}/>
  <Field label="Cantidad total que mantienes reservada USD" value={amount} onChangeText={setAmount} decimal/>
  <Field label="Motivo del importe o cambio" value={note} onChangeText={setNote} multiline maxLength={2000}/>
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar reserva manual" onPress={()=>void save()}/>:null}
 </Sheet>;
}
