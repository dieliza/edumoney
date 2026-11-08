import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Pressable } from 'react-native';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { newId } from '../../core/id';
import { userMessage } from '../../core/errors';
import { addAmounts } from '../../core/money';
import { ActionButton, Body, Card, Screen, SectionHeading } from '../../ui/components';
import { formatMoney, localToday } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { refreshBills } from '../bills/runtime';
import { shiftDays } from '../bills/domain';
import type { Bill } from '../bills/types';
import { DebtForm } from './DebtForm';
import { DebtPaymentForm } from './DebtPaymentForm';
import { DebtSimulator } from './DebtSimulator';
import { debtWarnings, minimumRemaining, planSteps } from './domain';
import { getDebtStore } from './localStore';
import type { DebtStore } from './store';
import { debtLabels, type Debt, type DebtPayment, type DebtSnapshot } from './types';
const empty:DebtSnapshot={debts:[],payments:[],events:[],plans:[],movements:[],bills:[]};
export default function DebtsScreen(){
 const focused=useIsFocused();const params=useLocalSearchParams<{debtId?:string;billId?:string}>();const handled=useRef('');
 const [store,setStore]=useState<DebtStore|null>(null);const [data,setData]=useState(empty);const [tab,setTab]=useState('debts');const [archived,setArchived]=useState(false);
 const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);const [form,setForm]=useState<Debt|true|null>(null);
 const [historyLimit,setHistoryLimit]=useState(50);
 const [detailId,setDetailId]=useState<string|null>(null);const [reason,setReason]=useState('');const [payment,setPayment]=useState<{debt:Debt;bill?:Bill}|null>(null);
 const load=useCallback(async()=>{
  const s=await getDebtStore();const snapshot=await s.snapshot();setStore(s);setData(snapshot);
  const key=`${params.debtId??''}:${params.billId??''}`;
  if(params.debtId&&handled.current!==key){
   handled.current=key;const d=snapshot.debts.find(d=>d.id===params.debtId);const b=snapshot.bills.find(b=>b.id===params.billId);
   if(d&&b&&!b.voidedAt&&b.amountCents>b.paidCents)setPayment({debt:d,bill:b});else setError('Revisa la deuda y factura seleccionadas; puede que ya estén pagadas o hayan cambiado.');
  }
  return snapshot;
 },[params.debtId,params.billId]);
 useEffect(()=>{if(!focused)return;let active=true;const refresh=()=>{void load().catch(()=>{if(active)setError('No pudimos cargar las deudas cifradas. Vuelve a abrir esta sección.');});};refresh();const subscription=AppState.addEventListener('change',state=>{if(state==='active')refresh();});return()=>{active=false;subscription.remove();};},[focused,load]);

 async function refreshed(){await load();const result=await refreshBills();return result.reminderMessage.startsWith('No se pudieron')?result.reminderMessage:'';}
 async function action(task:()=>Promise<unknown>,message:string){if(busy)return;setBusy(true);setError('');try{await task();const warning=await refreshed();setNotice([message,warning].filter(Boolean).join(' '));}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 const summary=useMemo(()=>{try{const active=data.debts.filter(d=>!d.archived);return {total:addAmounts(...active.map(d=>d.balanceCents)),minimum:addAmounts(...active.map(d=>minimumRemaining(d)).filter(v=>v!==null)),unknown:active.filter(d=>d.balanceCents>0&&(d.minimumCents===null||!d.dueDate)).length,error:''};}catch{return {total:null,minimum:null,unknown:0,error:'El total excede el rango monetario. Revisa los saldos.'};}},[data.debts]);
 const detail=data.debts.find(d=>d.id===detailId);const today=localToday();const active=data.debts.filter(d=>!d.archived&&d.balanceCents>0);const plan=data.plans[0];
 function row(d:Debt){return <Pressable key={d.id} accessibilityRole="button" accessibilityLabel={`Deuda ${d.name}, saldo ${formatMoney(d.balanceCents)}, mínimo ${d.minimumCents===null?'desconocido':formatMoney(d.minimumCents)}, vencimiento ${d.dueDate??'desconocido'}`} onPress={()=>{setDetailId(d.id);setReason('');setError('');}}><Card><Body style={{fontWeight:'700'}}>{d.name} · {debtLabels[d.kind]}</Body><Body>Saldo registrado: {formatMoney(d.balanceCents)}</Body><Body>APR base: {d.annualRateBps===null?'Sin confirmar':`${(d.annualRateBps/100).toFixed(2)}%`} · Mínimo: {d.minimumCents===null?'Sin confirmar':formatMoney(d.minimumCents)}</Body><Body>Vencimiento: {d.dueDate??'Sin confirmar'}</Body>{debtWarnings(d,today).map(message=><Body key={message} muted>{message}</Body>)}</Card></Pressable>;}
 return <Screen title="Ordenar mis pagos" demo={false} subtitle="Deudas registradas y alternativas para organizarlas.">
  <ActionButton title="Volver a Mi dinero" secondary onPress={()=>router.dismissTo('/money')}/><ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  <ActionButton title="Añadir deuda" testID="add-debt" onPress={()=>setForm(true)}/>
  <Choices label="Vista de deudas" value={tab} options={[[ 'debts','Deudas'],['calendar','Calendario de pagos'],['simulator','Simulador'],['plan','Plan de 30 días']]} onChange={setTab}/>
  {!store?<ActivityIndicator accessibilityLabel="Cargando deudas cifradas"/>:null}
  {tab==='debts'?<>
   <Card><Body style={{fontWeight:'700'}}>Total de deudas registradas</Body><Body style={{fontSize:30,lineHeight:40,fontWeight:'800'}}>{summary.total===null?'Revisar importes':formatMoney(summary.total)}</Body><Body>Mínimos pendientes conocidos del vencimiento actual: {summary.minimum===null?'Revisar importes':formatMoney(summary.minimum)}</Body>{summary.unknown?<Body>{summary.unknown} deuda(s) necesitan mínimo o vencimiento; el total de mínimos puede estar incompleto.</Body>:null}<Body muted>No es una consulta a tu entidad. Incluye el último saldo base que confirmaste y los pagos que indicaste que lo reducen. Las fechas no avanzan automáticamente.</Body><ErrorNotice message={summary.error}/></Card>
   <ActionButton title={archived?'Ver deudas actuales':'Ver deudas archivadas'} secondary onPress={()=>setArchived(!archived)}/>
   {data.debts.filter(d=>d.archived===archived).map(row)}{!data.debts.filter(d=>d.archived===archived).length?<Card><Body>{archived?'No hay deudas archivadas.':'Aún no has registrado deudas. Puedes dejar vacíos los datos que no conozcas.'}</Body></Card>:null}
  </>:null}
  {tab==='calendar'?<>
   <Card><Body>Calendario por vencimientos confirmados. Se resta únicamente lo que asignaste a ese vencimiento; pagar no cambia la próxima fecha. El mínimo es una referencia de tu estado, no un cálculo de la entidad.</Body></Card>
   {[...active].filter(d=>d.dueDate).sort((a,b)=>a.dueDate!.localeCompare(b.dueDate!)).map(d=><Card key={d.id}><Body style={{fontWeight:'700'}}>{d.dueDate} · {d.name}</Body><Body>Mínimo pendiente: {minimumRemaining(d)===null?'Sin confirmar':formatMoney(minimumRemaining(d)!)}</Body><Body>{minimumRemaining(d)===0?'Mínimo registrado atendido; confirma el próximo estado.':d.dueDate!<today?'Atrasado según la fecha registrada.':d.dueDate===today?'Vence hoy.':'Próximo vencimiento registrado.'}</Body><ActionButton title={`Revisar deuda: ${d.name}`} secondary onPress={()=>{setDetailId(d.id);setReason('');}}/></Card>)}
   {active.filter(d=>!d.dueDate).map(d=><Card key={d.id}><Body>{d.name}: falta el vencimiento; no se inventa una fecha.</Body><ActionButton title={`Completar deuda: ${d.name}`} secondary onPress={()=>setForm(d)}/></Card>)}
   {!active.length?<Card><Body>No hay deudas activas con saldo pendiente.</Body></Card>:null}
  </>:null}
  {tab==='simulator'?<DebtSimulator debts={data.debts}/>:null}
  {tab==='plan'?<>
   <Card><Body>Organiza revisiones durante 30 días. «Ya lo hice» confirma una tarea; no registra un pago ni modifica saldos. Cada avance cuenta.</Body></Card>
   {store&&!busy?<ActionButton title="Crear mi plan de 30 días" testID="debt-create-plan" onPress={()=>void action(()=>store.createPlan(newId(),today),'Plan guardado en este dispositivo.')}/>:null}
   {plan?<><Card><Body style={{fontWeight:'700'}}>Plan iniciado {plan.startDate}</Body><Body>{plan.actions.filter(a=>a.completedAt).length} de {planSteps.length} tareas revisadas. Vas construyendo tu organización paso a paso.</Body></Card>{planSteps.map(step=>{const done=plan.actions.find(a=>a.key===step.key)?.completedAt;return <Card key={step.key}><Body style={{fontWeight:'700'}}>Día {step.day} · {step.title}</Body><Body>Fecha sugerida: {shiftDays(plan.startDate,step.day-1)} · {done?'Revisada':'Pendiente de revisar'}</Body>{!busy&&store?<ActionButton title={done?`Volver a pendiente: ${step.title}`:`Ya lo hice: ${step.title}`} secondary onPress={()=>void action(()=>store.checkAction(plan.id,step.key,!done),done?'Tarea pendiente de nuevo.':'Revisión guardada. Buen paso para organizarte.')}/>:null}</Card>;})}</>:null}
   {data.plans.length>1?<Card><Body>Planes anteriores conservados: {data.plans.slice(1).map(p=>`${p.startDate} (${p.actions.filter(a=>a.completedAt).length}/${planSteps.length})`).join(' · ')}</Body></Card>:null}
  </>:null}
  {form&&store?<DebtForm initial={form===true?undefined:form} store={store} saved={async()=>{const warning=await refreshed();setNotice(['Deuda guardada. Los pagos y cambios anteriores se conservan.',warning].filter(Boolean).join(' '));}} close={()=>setForm(null)}/>:null}
  {payment&&store?<DebtPaymentForm debt={payment.debt} initialBill={payment.bill} store={store} movements={data.movements} bills={data.bills} saved={async()=>{const warning=await refreshed();setNotice(['Pago asignado sin añadir otro gasto de compra. Revisa el saldo y el estado de avisos en Mis facturas.',warning].filter(Boolean).join(' '));}} close={()=>setPayment(null)}/>:null}
  {detail&&store?<Sheet title="Detalle de deuda" busy={busy} close={()=>setDetailId(null)}>
   <Body style={{fontWeight:'700'}}>{detail.name} · {debtLabels[detail.kind]}</Body><Body>Saldo registrado: {formatMoney(detail.balanceCents)}</Body><Body>Saldo base confirmado: {detail.balanceAsOf??'Fecha desconocida'}</Body><Body>APR base: {detail.annualRateBps===null?'Sin confirmar':`${(detail.annualRateBps/100).toFixed(2)}%`}</Body><Body>Vencimiento: {detail.dueDate??'Sin confirmar'} · Corte: {detail.closingDate??'Sin confirmar'}</Body><Body>Cargos facturados conocidos: {detail.feesCents===null?'Sin confirmar':formatMoney(detail.feesCents)} (ya incluidos en el saldo base)</Body>
   {detail.futureRateBps!==null?<Body>Nueva APR conocida: {(detail.futureRateBps/100).toFixed(2)}% desde {detail.rateChangeDate}</Body>:null}
   {detail.archived&&!busy?<ActionButton title="Actualizar estado de deuda archivada" secondary onPress={()=>{setForm(detail);setDetailId(null);}}/>:null}
   {!detail.archived&&!busy?<><ActionButton title="Ya lo hice: registrar pago" testID="debt-pay" onPress={()=>{setPayment({debt:detail});setDetailId(null);}}/><ActionButton title="Actualizar estado o condiciones" secondary onPress={()=>{setForm(detail);setDetailId(null);}}/>
    <ActionButton title="Preparar factura del mínimo pendiente" secondary onPress={()=>void action(async()=>{await store.scheduleMinimum(detail.id,detail.version);},'Factura preparada o ya existente para ese vencimiento. Revísala en Mis facturas; aún no se ha pagado.')}/><Body muted>Los mínimos no se descuentan por sí solos del disponible de Mi dinero. Preparar una factura permite registrar el compromiso una sola vez para ese vencimiento.</Body><ActionButton title="Abrir Mis facturas" secondary onPress={()=>{setDetailId(null);router.push('/bills');}}/></>:null}
   <SectionHeading title="Historial de saldos"/><Body muted>Variación de saldos registrados, incluidos pagos y conciliaciones. No equivale a principal amortizado si falta el desglose. Los intereses nuevos solo se incorporan al confirmar un nuevo estado.</Body>
   {data.events.filter(e=>e.debtId===detail.id).slice(0,historyLimit).map(e=><Body key={e.id}>{e.effectiveDate??'Fecha desconocida'} · {e.kind==='opening'?'Saldo inicial':e.kind==='payment'?'Pago':e.kind==='reconcile'?'Conciliación':e.kind==='reversal'?'Reversión':e.kind==='archive'?'Archivada':'Condiciones'}: {formatMoney(e.balanceBefore)} → {formatMoney(e.balanceAfter)} · {e.reason}</Body>)}
   <SectionHeading title="Pagos vinculados"/>{data.payments.filter(p=>p.debtId===detail.id).slice(0,historyLimit).map(p=><PaymentHistory key={p.id} payment={p} debt={detail} busy={busy} reverse={()=>void action(()=>store.reverse(p.id,reason),'Vínculo revertido con historial conservado. Revisa saldo y facturas.')}/>)}
   {Math.max(data.events.filter(e=>e.debtId===detail.id).length,data.payments.filter(p=>p.debtId===detail.id).length)>historyLimit?<ActionButton title="Mostrar más historial de deuda" secondary onPress={()=>setHistoryLimit(historyLimit+50)}/>:null}
   <Field label="Motivo de reversión o archivo de deuda" value={reason} onChangeText={setReason} multiline/>
   {!detail.archived&&!detail.balanceCents&&!busy?<ActionButton title="Archivar deuda liquidada" secondary onPress={()=>void action(()=>store.archive(detail.id,detail.version,reason),'Deuda archivada; su historial se conserva.')}/>:null}
   <ErrorNotice message={error}/>
  </Sheet>:null}
 </Screen>;
}
function PaymentHistory({payment:p,debt,busy,reverse}:{payment:DebtPayment;debt:Debt;busy:boolean;reverse():void}){
 return <Card><Body style={{fontWeight:'700'}}>{p.date} · {formatMoney(p.amountCents)} · {p.reversedAt?'Revertido':'Confirmado'}</Body><Body>Principal: {p.principalCents===null?'Desconocido':formatMoney(p.principalCents)} · Intereses: {p.interestCents===null?'Desconocidos':formatMoney(p.interestCents)} · Cargos: {p.feesCents===null?'Desconocidos':formatMoney(p.feesCents)}</Body><Body muted>Vencimiento asignado: {p.cycleDueDate??'Sin confirmar'}. Movimiento: {p.movementId}</Body>
  {p.reversedAt?<Body>Motivo: {p.reversalReason}</Body>:<><Body muted>{p.createdMovement?'Revertir retira el movimiento creado aquí y revierte sus vínculos de factura.':'Revertir solo deshace esta asignación; el movimiento preexistente se conserva.'} {p.balanceRevision===debt.balanceRevision?'Se devuelve al saldo lo que este pago descontó.':'Hay un saldo confirmado posterior: se conserva ese saldo al revertir.'} Escribe el motivo debajo antes de confirmar.</Body>{!busy?<ActionButton title={`Revertir pago de deuda de ${formatMoney(p.amountCents)}`} secondary onPress={reverse}/>:null}</>}
 </Card>;
}
