import { useState } from 'react';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Sheet } from '../money/fields';
import { getDocumentStore } from '../documents/localStore';
import { formatMoney } from '../money/domain';
import { businessExport } from './ledgerDomain';
import { shareBusinessExport } from './export';
import type { BusinessLedgerSnapshot } from './ledgerTypes';
export function BusinessExportForm({data,holderId,projectId,close}:{data:BusinessLedgerSnapshot;holderId:string;projectId:string|null;close():void}) {
 const [selected,setSelected]=useState<string[]>([]),[images,setImages]=useState('no'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const report=businessExport(data,holderId,projectId,selected);
 const entries=data.entries.filter(e=>e.holderId===holderId&&(!projectId||e.allocations.some(a=>a.projectId===projectId)));
 const documents=data.documents.filter(d=>entries.some(e=>e.movementId===d.movementId));
 async function share(format:'json'|'csv'){if(busy)return;setBusy(true);setError('');try{
  const copies:{id:string;mime:string;base64:string}[]=[];
  if(format==='json'&&images==='yes') {const store=await getDocumentStore();for(const d of report.documents.filter(d=>d.encryptedPath&&!d.deletedAt)){const content=await store.content(d.id);if(!content)throw new UserInputError('Una copia ya no está disponible. Vuelve a abrir la exportación y revisa los comprobantes.');copies.push({id:d.id,...content});}}
  await shareBusinessExport(report,copies,format);
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title="Exportación comercial para el CPA" close={close} busy={busy}>
  <Body>Titular: {report.holder.legalName}. {projectId?'Solo el proyecto seleccionado.':'Todos los proyectos del titular.'} Se incluyen todas las fechas registradas en esta vista.</Body>
  <Body>Ingresos netos: {formatMoney(report.totals.receivedCents)} · Gastos registrados: {formatMoney(report.totals.expenseCents)} · Parte comercial identificada: {formatMoney(report.totals.commercialExpenseCents)}.</Body>
  <Body>El expediente JSON incluye movimientos repartidos, totales, reservas manuales del titular, partidas pendientes y comprobantes seleccionados. Las reservas del titular no se reparten ni se suman como gastos del proyecto. El CSV contiene solo las filas de movimientos y referencias; sus importes están en centavos USD.</Body>
  {report.pending.map((p,i)=><Body key={i}>{p}</Body>)}
  <Body style={{fontWeight:'700'}}>Comprobantes a incluir</Body>
  {documents.map(d=><ActionButton key={d.id} title={`${selected.includes(d.id)?'Retirar':'Incluir'} comprobante: ${d.description||d.id} · ${d.status}`} secondary onPress={()=>setSelected(current=>current.includes(d.id)?current.filter(id=>id!==d.id):[...current,d.id])}/>)}
  <Choices label="Copias de imágenes en el expediente JSON" value={images} options={[["no","Compartir solo datos y referencias"],["yes","Incluir copias de los comprobantes seleccionados"]]} onChange={setImages}/>
  <Body>Compartir genera un archivo legible fuera del respaldo cifrado. Tú eliges el destino. No se envía automáticamente ni confirma deducibilidad.</Body>
  <ErrorNotice message={error}/>{!busy?<><ActionButton title="Confirmar y compartir expediente JSON" onPress={()=>void share('json')}/><ActionButton title="Compartir CSV de movimientos" secondary onPress={()=>void share('csv')}/></>:<Body>Preparando archivo local…</Body>}
 </Sheet>;
}
