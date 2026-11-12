import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Pressable, View } from 'react-native';
import { router, useIsFocused } from 'expo-router';
import { userMessage } from '../../core/errors';
import { ActionButton, Body, Card, IconBadge, Screen, SectionHeading } from '../../ui/components';
import { useTheme } from '../../design/ThemeProvider';
import { formatMoney, localToday, validMonth } from '../money/domain';
import { Choices, ErrorNotice, Field, Sheet } from '../money/fields';
import { BillForm } from './BillForm';
import { PaymentForm } from './PaymentForm';
import { billStatus, cadenceLabels, outstanding, shiftDays } from './domain';
import { refreshBills } from './runtime';
import { calendarCopy, enableReminders } from './services';
import type { BillsStore } from './store';
import type { Bill, BillPayment, BillSnapshot } from './types';
const empty:BillSnapshot={bills:[],series:[],payments:[],categories:[],movements:[]};
export default function BillsScreen(){
 const {colors}=useTheme();const focused=useIsFocused();
 const [store,setStore]=useState<BillsStore|null>(null);const [data,setData]=useState(empty);const [reminders,setReminders]=useState('Comprobando avisos locales…');
 const [error,setError]=useState('');const [notice,setNotice]=useState('');const [busy,setBusy]=useState(false);
 const [tab,setTab]=useState('upcoming');const [month,setMonth]=useState(localToday().slice(0,7));const [limit,setLimit]=useState(50);const [showVoided,setShowVoided]=useState(false);
 const [form,setForm]=useState<Bill|true|null>(null);const [pay,setPay]=useState<Bill|null>(null);const [detailId,setDetailId]=useState<string|null>(null);const [reason,setReason]=useState('');
 const [revisions,setRevisions]=useState<{reason:string;recordedAt:string;beforeJson:string}[]>([]);
 const load=useCallback(async()=>{const result=await refreshBills();setStore(result.store);setData(result.data);setReminders(result.reminderMessage);},[]);
 useEffect(()=>{if(!focused)return;let active=true;const refresh=()=>{void load().catch(()=>{if(active)setError('No pudimos cargar las facturas cifradas. Vuelve a abrir esta sección.');});};refresh();const subscription=AppState.addEventListener('change',s=>{if(s==='active')refresh();});return()=>{active=false;subscription.remove();};},[focused,load]);
 async function action(task:()=>Promise<unknown>,message:string){if(busy)return;setBusy(true);setError('');try{await task();await load();if(message)setNotice(message);}catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 const today=localToday();const detail=data.bills.find(b=>b.id===detailId);
 const rows=data.bills.filter(b=>tab==='paid'?!b.voidedAt && outstanding(b)===0:tab==='calendar'?validMonth(month)&&b.dueDate.startsWith(month):showVoided?!!b.voidedAt:!b.voidedAt&&outstanding(b)>0);
 const pendingGeneration=data.series.some(s=>s.active && s.nextDate<=(today>'9999-10-01'?'9999-12-31':shiftDays(today,90)));
 function open(b:Bill){setDetailId(b.id);setReason('');setRevisions([]);setError('');}
 function row(b:Bill){return <Pressable key={b.id} accessibilityRole="button" accessibilityLabel={`Factura ${b.provider}, ${billStatus(b,today)}, ${b.dueDate}, Importe: ${formatMoney(b.amountCents)}, Pendiente: ${formatMoney(outstanding(b))}`} onPress={()=>open(b)}><Card><View style={{flexDirection:'row',alignItems:'center',gap:12}}><IconBadge icon={outstanding(b)===0?'checkmark-circle':'calendar'} tone={outstanding(b)===0?'mint':'blue'} size={42}/><View style={{flex:1}}><Body style={{fontWeight:'700'}}>{b.provider}</Body><Body muted style={{fontSize:13}}>{b.dueDate} · {billStatus(b,today)}</Body></View><Body style={{fontWeight:'800'}}>{formatMoney(outstanding(b))}</Body></View><Body muted>Importe: {formatMoney(b.amountCents)} · Pagado: {formatMoney(b.paidCents)}</Body>{b.seriesId?<Body muted>Factura recurrente · cada vencimiento se paga por separado</Body>:null}</Card></Pressable>;}

 return <Screen title="Mis facturas" demo={false} subtitle="Vencimientos y pagos que tú confirmas.">
  <ActionButton title="Volver a Mi dinero" secondary onPress={()=>router.dismissTo('/money')}/><ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  <ActionButton title="Añadir factura" testID="add-bill" icon="add-circle-outline" onPress={()=>{setForm(true);setError('');}}/>
  <Choices presentation="tabs" label="Vista de facturas" value={tab} options={[[ 'upcoming','Próximas'],['paid','Pagadas'],['calendar','Calendario']]} onChange={v=>{setTab(v);setLimit(50);}}/>
  {!store?<ActivityIndicator color={colors.accent} accessibilityLabel="Cargando facturas"/>:null}
  {tab==='calendar'?<><Field label="Mes del calendario (AAAA-MM)" value={month} onChangeText={setMonth}/><Body muted>Agenda mensual por vencimiento. Incluye facturas pendientes, pagadas y anuladas; un atraso conserva su fecha original.</Body>{!validMonth(month)?<ErrorNotice message="Escribe un mes válido en formato AAAA-MM."/>:null}</>:null}
  {tab==='upcoming'?<><Card><Body>Una factura programada no es un pago. Los atrasos conservan su vencimiento hasta que registres un cambio con motivo.</Body></Card><ActionButton title={showVoided?'Ver facturas pendientes':'Ver historial de anuladas'} secondary onPress={()=>{setShowVoided(!showVoided);setLimit(50);}}/></>:null}
  {rows.slice(0,limit).map((b,index)=><View key={b.id} style={{gap:12}}>{tab==='calendar'&&(index===0||rows[index-1].dueDate!==b.dueDate)?<SectionHeading title={b.dueDate}/>:null}{row(b)}</View>)}
  {store&&!rows.length?<Card><Body>{tab==='paid'?'Aún no hay facturas completamente pagadas.':tab==='calendar'?'Sin facturas para este mes.':showVoided?'No hay facturas anuladas.':'No hay facturas pendientes.'}</Body></Card>:null}
  {rows.length>limit?<ActionButton title="Mostrar más facturas" secondary onPress={()=>setLimit(limit+50)}/>:null}
  <SectionHeading title="Recordatorios locales"/><Card><Body>{reminders}</Body><Body muted>No incluyen proveedor ni importe. Se revisan al abrir la app y al volver a ella. Para recibir avisos elige los días de anticipación dentro de cada factura. No se envían a servidores.</Body>{!busy?<><ActionButton title="Activar avisos locales" secondary onPress={()=>void action(async()=>{const granted=await enableReminders();if(!granted)setNotice('Permiso no concedido. Puedes habilitarlo en los ajustes del dispositivo.');},'')}/><ActionButton title="Revisar avisos y próximas fechas" secondary onPress={()=>void action(async()=>undefined,'Fechas y avisos revisados.')}/></>:null}</Card>
  <SectionHeading title="Series recurrentes"/>{pendingGeneration?<Card><Body>Quedan vencimientos por preparar. Pulsa Revisar avisos y próximas fechas para continuar el lote; no se descartan fechas atrasadas.</Body></Card>:null}
  {!data.series.length?<Card><Body>Puedes elegir frecuencia al añadir una factura.</Body></Card>:data.series.map(s=><Card key={s.id}><Body style={{fontWeight:'700'}}>{s.provider}</Body><Body>{formatMoney(s.amountCents)} · Cada {s.intervalCount} {cadenceLabels[s.cadence].toLocaleLowerCase('es')} · {s.active?'Activa':'En pausa o terminada'}</Body><Body muted>Próxima fecha por generar: {s.nextDate}{s.endDate?` · Última: ${s.endDate}`:''}. Pausar conserva las facturas ya generadas; puedes anular su pendiente individualmente.</Body>{!busy&&store?<ActionButton title={`${s.active?'Pausar':'Reanudar'} serie: ${s.provider}`} secondary onPress={()=>void action(()=>store.toggleSeries(s.id,!s.active),'Serie actualizada; las facturas existentes se conservan.')}/>:null}</Card>)}
  {form&&store?<BillForm initial={form===true?undefined:form} categories={data.categories} store={store} saved={async()=>{await load();setNotice('Factura guardada. Guardar o editar no confirma pagos nuevos.');}} close={()=>setForm(null)}/>:null}
  {pay&&store?<PaymentForm bill={pay} store={store} movements={data.movements} saved={async()=>{await load();setNotice('Pago vinculado. Consulta el pendiente y el estado de avisos.');}} close={()=>setPay(null)}/>:null}
  {detail&&store?<Sheet title="Detalle de factura" close={()=>setDetailId(null)} busy={busy}>
   <Body style={{fontWeight:'700'}}>{detail.provider} · {billStatus(detail,today)}</Body><Body>Vence: {detail.dueDate} · Total: {formatMoney(detail.amountCents)}</Body><Body>Pagado: {formatMoney(detail.paidCents)} · Pendiente: {formatMoney(outstanding(detail))}</Body>
   <Body muted>{detail.paymentKind==='debt_payment'?'Pago de tarjeta o deuda: no vuelve a contar compras.':'Servicio o compra: se registra como gasto al confirmar el pago.'}</Body>{detail.legacyRecurrence?<Body muted>Frecuencia antigua conservada: {detail.legacyRecurrence}. No se generaron fechas a partir de texto sin validar.</Body>:null}
   {!detail.voidedAt&&outstanding(detail)>0&&!busy?<ActionButton title="Ya lo pagué" testID="bill-paid" onPress={()=>{if(detail.debtId){setDetailId(null);router.push({pathname:'/debts',params:{debtId:detail.debtId,billId:detail.id}});}else{setPay(detail);setDetailId(null);}}}/>:null}
   {!detail.voidedAt&&!busy?<ActionButton title="Editar factura o vencimiento" secondary onPress={()=>{setForm(detail);setDetailId(null);}}/>:null}
   {!detail.voidedAt&&!busy?<><Body muted>El calendario puede sincronizarse con tu proveedor. Solo se copia una fecha con título genérico; tú eliges si guardarla. No confirma pagos, ni actualiza o borra copias anteriores.</Body><ActionButton title="Abrir copia en calendario" secondary onPress={()=>void action(async()=>{const message=await calendarCopy(detail);if(message)setNotice(message);},'')}/></>:null}
   <SectionHeading title="Historial de pagos" onSurface/>{data.payments.filter(p=>p.billId===detail.id).map(p=><PaymentHistory key={p.id} payment={p} busy={busy} reverse={()=>void action(()=>store.reversePayment(p.id,reason),'Pago revertido. El historial se conserva y el pendiente se recalcula.')}/>)}
   {!data.payments.some(p=>p.billId===detail.id)?<Body>Sin pagos confirmados.</Body>:null}
   <Field label="Motivo de anulación o reversión" value={reason} onChangeText={setReason} multiline/>
   {!detail.voidedAt&&outstanding(detail)>0&&!busy?<><Body muted>Anular el pendiente conserva los pagos realizados y el historial. No detiene la serie recurrente.</Body><ActionButton title="Confirmar anulación del pendiente" secondary onPress={()=>void action(()=>store.voidBill(detail.id,detail.version,reason),'Pendiente anulado con motivo registrado.')}/></>:null}
   {!busy?<ActionButton title="Ver cambios de vencimiento e importe" secondary onPress={()=>void action(async()=>setRevisions(await store.revisions(detail.id)),'Historial de cambios cargado.')}/>:null}
   {revisions.map((r,i)=>{let before:Bill|null=null;try{before=JSON.parse(r.beforeJson);}catch{}return <Body key={i}>{r.recordedAt} · {r.reason}{before?` · Antes: ${before.dueDate}, ${formatMoney(before.amountCents)}`:''}</Body>;})}<ErrorNotice message={error}/>
  </Sheet>:null}
 </Screen>;
}
function PaymentHistory({payment:p,busy,reverse}:{payment:BillPayment;busy:boolean;reverse():void}){
 return <Card><Body>{p.date} · {formatMoney(p.amountCents)} · {p.reversed?'Revertido':'Confirmado'}</Body><Body muted>Movimiento: {p.movementId}</Body>{p.reversed?<Body>Motivo: {p.reason}</Body>:<><Body muted>{p.createdMovement?'Revertir retirará del cálculo el movimiento creado por este pago.':'Revertir solo desvinculará el movimiento que ya existía; su gasto se conserva.'} Escribe el motivo debajo antes de confirmar.</Body>{!busy?<ActionButton title={`Revertir pago de ${formatMoney(p.amountCents)}`} secondary onPress={reverse}/>:null}</>}</Card>;
}
