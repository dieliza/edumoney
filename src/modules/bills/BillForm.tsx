import { useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { userMessage } from '../../core/errors';
import { ActionButton, Body } from '../../ui/components';
import { inputAmount, localToday } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import type { Category } from '../money/types';
import { SimilarBillError, type BillsStore } from './store';
import type { Bill, BillInput, Cadence } from './types';
export function BillForm({initial,store,categories,close,saved}:{initial?:Bill;store:BillsStore;categories:Category[];close():void;saved():Promise<void>}){
 const [id]=useState(()=>initial?.id??newId());const [seriesId]=useState(newId);
 const [provider,setProvider]=useState(initial?.provider??'');const [amount,setAmount]=useState(initial?inputAmount(initial.amountCents):'');
 const [due,setDue]=useState(initial?.dueDate??localToday());const [category,setCategory]=useState(initial?.categoryId??'none');
 const [kind,setKind]=useState<BillInput['paymentKind']>(initial?.paymentKind??'expense');
 const [frequency,setFrequency]=useState<'once'|Cadence>('once');const [interval,setInterval]=useState('1');const [end,setEnd]=useState('');
 const [days,setDays]=useState(initial?.reminderDays===null || initial?.reminderDays===undefined?'':String(initial.reminderDays));
 const [similar,setSimilar]=useState(false);
 const [reason,setReason]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function save(confirmSimilar=false){if(busy)return;setBusy(true);setError('');try{
  const b:BillInput={id,provider:provider.trim(),amountCents:parseAmount(amount.trim()),dueDate:due.trim(),categoryId:kind==='expense' && category!=='none'?category:null,paymentKind:kind,reminderDays:days.trim()===''?null:Number(days)};
  if(initial)await store.edit(b,initial.version,reason);else await store.create(b,frequency==='once'?null:{id:seriesId,cadence:frequency,intervalCount:Number(interval),endDate:end.trim()||null},confirmSimilar);
  await saved();close();
 }catch(e){setError(userMessage(e));setSimilar(e instanceof SimilarBillError);}finally{setBusy(false);}}
 return <Sheet title={initial?'Editar factura':'Añadir factura'} close={close} busy={busy}>
  <Field label="Proveedor" testID="bill-provider" value={provider} onChangeText={setProvider}/>
  <Field label="Importe de factura (USD)" testID="bill-amount" value={amount} onChangeText={setAmount} decimal/>
  <Field label="Vencimiento (AAAA-MM-DD)" testID="bill-due" value={due} onChangeText={setDue}/>
  <Choices label="Qué se paga" value={kind} options={[[ 'expense','Servicio o compra'],['debt_payment','Tarjeta o deuda']]} onChange={value=>{setKind(value);if(value==='debt_payment')setCategory('none');}}/>
  <Body muted>El pago de tarjeta o deuda no vuelve a contar las compras como gastos. Una factura pendiente aún no es un gasto pagado.</Body>
  {kind==='expense'?<Choices label="Categoría de factura" value={category} options={[[ 'none','Sin categoría'],...categories.filter(c=>c.kind==='expense' && (!c.archived || c.id===initial?.categoryId)).map(c=>[c.id,c.name] as const)]} onChange={setCategory}/>:null}
  {!initial?<><Choices<'once'|Cadence> label="Frecuencia" value={frequency} options={[[ 'once','Una vez'],['monthly','Mensual'],['weekly','Semanal'],['days','Cada varios días']]} onChange={setFrequency}/>
   {frequency!=='once'?<><Field label="Cada cuántos intervalos (1 a 365)" value={interval} onChangeText={setInterval}/><Field label="Último vencimiento (opcional, AAAA-MM-DD)" value={end} onChangeText={setEnd}/><Body muted>Se preparan los próximos 90 días al abrir la app. Las fechas no se marcan pagadas automáticamente.</Body></>:null}</>:<Body muted>Este cambio afecta solo esta factura. Conserva el vencimiento anterior en el historial; no desplaza la serie. Para cambiar condiciones futuras, pausa la serie y crea otra.</Body>}
  <Field label="Avisar días antes (0 a 30, vacío sin aviso)" testID="bill-reminder-days" value={days} onChangeText={setDays}/>
  <Body muted>Hora local: 9:00. Requiere activar avisos y permiso del dispositivo. Si la hora del aviso ya pasó, revisa la factura aquí.</Body>
  {initial?<Field label="Motivo del cambio de factura" value={reason} onChangeText={setReason} multiline/>:null}
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar factura" testID="bill-save" onPress={()=>void save()}/>:null}
  {similar&&!busy?<><Body>Confirma solo si se trata de una obligación distinta.</Body><ActionButton title="Guardar otra factura distinta" secondary onPress={()=>void save(true)}/></>:null}
 </Sheet>;
}
