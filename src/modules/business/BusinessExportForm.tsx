import { useMemo,useState } from 'react';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../money/fields';
import { getDocumentStore } from '../documents/localStore';
import { formatMoney } from '../money/domain';
import { businessExport } from './ledgerDomain';
import { shareBusinessExport } from './export';
import type { BusinessLedgerSnapshot } from './ledgerTypes';
export function BusinessExportForm({data,holderId,projectId,close}:{data:BusinessLedgerSnapshot;holderId:string;projectId:string|null;close():void}) {
 const [selected,setSelected]=useState<string[]>([]),[images,setImages]=useState('no'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const [dateMode,setDateMode]=useState<'all'|'period'>('all');
 const [from,setFrom]=useState(''),[to,setTo]=useState('');
 const preview=useMemo(()=>{
  const period=dateMode==='period'?{from,to}:undefined;
  try {
   const report=businessExport(data,holderId,projectId,selected,period);
   const movementIds=new Set(report.rows.map(r=>r.movementId));
   return {report,transactionCount:movementIds.size,documents:data.documents.filter(d=>d.movementId&&movementIds.has(d.movementId)),error:''};
  } catch(e) {return {report:null,transactionCount:0,documents:[],error:userMessage(e)};}
 },[data,holderId,projectId,selected,dateMode,from,to]);
 const {report,documents,transactionCount}=preview;
 function changeScope(apply:()=>void){apply();setSelected([]);setImages('no');setError('');}
 async function share(format:'json'|'csv'){if(busy||!report)return;setBusy(true);setError('');try{
  const copies:{id:string;mime:string;base64:string}[]=[];
  if(format==='json'&&images==='yes') {const store=await getDocumentStore();for(const d of report.documents.filter(d=>d.encryptedPath&&!d.deletedAt)){const content=await store.content(d.id);if(!content)throw new UserInputError('Una copia ya no está disponible. Vuelve a abrir la exportación y revisa los comprobantes.');copies.push({id:d.id,...content});}}
  await shareBusinessExport(report,copies,format);
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title="Exportación comercial para el CPA" close={close} busy={busy}>
  <Body>Titular: {data.holders.find(h=>h.id===holderId)?.legalName}. {projectId?'Solo el proyecto seleccionado.':'Todos los proyectos del titular.'}</Body>
  <Choices<'all'|'period'> label="Fechas de las transacciones a exportar" value={dateMode} options={[["all","Todas las fechas"],["period","Elegir período"]]} onChange={v=>{if(!busy)changeScope(()=>setDateMode(v));}}/>
  {dateMode==='period'?<>
   <Body>Incluye Desde y Hasta según la fecha registrada de la transacción. Al cambiar el período tendrás que seleccionar los comprobantes otra vez.</Body>
   <Field label="Desde (AAAA-MM-DD)" testID="business-export-from" value={from} onChangeText={v=>{if(!busy)changeScope(()=>setFrom(v));}}/>
   <Field label="Hasta (AAAA-MM-DD)" testID="business-export-to" value={to} onChangeText={v=>{if(!busy)changeScope(()=>setTo(v));}}/>
  </>:null}
  <ErrorNotice message={preview.error}/>
  {report?<><Body>Transacciones a exportar: {transactionCount}.{report.rows.length!==transactionCount?` Filas en el archivo: ${report.rows.length}, porque hay transacciones repartidas entre proyectos.`:''}</Body>
  <Body>Ingresos netos: {formatMoney(report.totals.receivedCents)} · Gastos registrados: {formatMoney(report.totals.expenseCents)} · Parte comercial identificada: {formatMoney(report.totals.commercialExpenseCents)}.</Body>
  <Body>El expediente JSON incluye movimientos repartidos, totales, partidas pendientes y comprobantes seleccionados. {dateMode==='period'?'Las reservas actuales del titular se omiten porque no representan el período.':'Las reservas manuales del titular se incluyen, pero no se reparten ni se suman como gastos del proyecto.'} El CSV contiene solo las filas de movimientos y referencias; sus importes están en centavos USD.</Body>
  {report.pending.map((p,i)=><Body key={i}>{p}</Body>)}
  <Body style={{fontWeight:'700'}}>Comprobantes a incluir</Body>
  {documents.map(d=><ActionButton key={d.id} title={`${selected.includes(d.id)?'Retirar':'Incluir'} comprobante: ${d.description||d.id} · ${d.status}`} secondary onPress={()=>{if(!busy)setSelected(current=>current.includes(d.id)?current.filter(id=>id!==d.id):[...current,d.id]);}}/>)}
  <Choices label="Copias de imágenes en el expediente JSON" value={images} options={[["no","Compartir solo datos y referencias"],["yes","Incluir copias de los comprobantes seleccionados"]]} onChange={v=>{if(!busy)setImages(v);}}/>
  </>:null}
  <Body>Compartir genera un archivo legible fuera del respaldo cifrado. Tú eliges el destino. No se envía automáticamente ni confirma deducibilidad.</Body>
  <ErrorNotice message={error}/>{busy?<Body>Preparando archivo local…</Body>:report?<><ActionButton title="Confirmar y compartir expediente JSON" onPress={()=>void share('json')}/><ActionButton title="Compartir CSV de movimientos" secondary onPress={()=>void share('csv')}/></>:null}
 </Sheet>;
}
