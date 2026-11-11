import { useCallback,useEffect,useState } from 'react';
import { Image } from 'react-native';
import { router,useIsFocused,useLocalSearchParams } from 'expo-router';
import { userMessage } from '../../core/errors';
import { ActionButton,Body,Card,Screen,SectionHeading } from '../../ui/components';
import { Choices,ErrorNotice,Sheet } from '../money/fields';
import { getMoneyStore } from '../money/localStore';
import { formatMoney } from '../money/domain';
import type { LedgerMovement } from '../money/types';
import { getDocumentStore } from '../documents/localStore';
import type { StoredDocument } from '../documents/types';
import { statusOptions } from '../tax/types';
import { BusinessLedgerStore } from './ledgerStore';
import { businessExport,businessTotals,commercialAmount,cpaLabels,entryRows,reserveLabels,useLabels } from './ledgerDomain';
import type { BusinessEntry,BusinessLedgerSnapshot,ReserveKind } from './ledgerTypes';
import { BusinessEntryForm } from './BusinessEntryForm';
import { BusinessReceiptForm } from './BusinessReceiptForm';
import { BusinessReserveForm } from './BusinessReserveForm';
import { BusinessExportForm } from './BusinessExportForm';
const knownMoney=(value:number|null)=>value===null?'Pendiente de completar desglose':formatMoney(value);
const empty:BusinessLedgerSnapshot={holders:[],dbas:[],projects:[],entries:[],reserves:[],documents:[],movements:[]};
const receiptStatus=(document:StoredDocument)=>document.deletedAt?'Retirado':statusOptions.find(([code])=>code===document.status)?.[1]??'Estado por confirmar';
function ReceiptView({document,close}:{document:StoredDocument;close():void}) {
 const [copy,setCopy]=useState<{base64:string;mime:string}|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;if(document.encryptedPath&&!document.deletedAt)void getDocumentStore().then(s=>s.content(document.id)).then(c=>{if(active)setCopy(c);}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[document.id,document.encryptedPath,document.deletedAt]);
 return <Sheet title="Comprobante comercial" close={close}><Body>{document.description}</Body><Body>{document.date??'Fecha pendiente'} · {document.amountCents===null?'Importe pendiente':formatMoney(document.amountCents)}</Body><Body>{document.notes}</Body><Body>Estado: {receiptStatus(document)}. Referencia: {document.id}.</Body>{document.supersedesId?<Body>Corrige el comprobante {document.supersedesId}; no crea otro gasto.</Body>:null}{copy?<Image source={{uri:`data:${copy.mime};base64,${copy.base64}`}} accessibilityLabel="Copia local del recibo comercial" style={{width:'100%',height:360}} resizeMode="contain"/>:<Body>{document.encryptedPath&&!document.deletedAt?'Abriendo copia local…':'No hay copia local conservada.'}</Body>}<ErrorNotice message={error}/></Sheet>;
}
export default function BusinessLedgerScreen() {
 const params=useLocalSearchParams<{holderId?:string}>(),focused=useIsFocused();
 const [holderId,setHolder]=useState(params.holderId??''),[projectId,setProject]=useState('');
 const [data,setData]=useState(empty),[store,setStore]=useState<BusinessLedgerStore>(),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [form,setForm]=useState<{kind:'income'|'expense';initial?:BusinessEntry}|null>(null);
 const [receipt,setReceipt]=useState<LedgerMovement|null>(null),[viewReceipt,setViewReceipt]=useState<StoredDocument|null>(null);
 const [reserving,setReserving]=useState(false),[exporting,setExporting]=useState(false),[limit,setLimit]=useState(30);
 const load=useCallback(async()=>{const s=new BusinessLedgerStore(await getMoneyStore());const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;let active=true;void getMoneyStore().then(async ledger=>{const s=new BusinessLedgerStore(ledger),d=await s.snapshot();if(active){setStore(s);setData(d);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[focused]);
 const holder=data.holders.find(h=>h.id===holderId),projects=data.projects.filter(p=>p.holderId===holderId);
 const entries=data.entries.filter(e=>e.holderId===holderId&&(!projectId||e.allocations.some(a=>a.projectId===projectId)));
 let totals:ReturnType<typeof businessTotals>|null=null,totalsError='';
 try{totals=businessTotals(entries,projectId||undefined);}catch(e){totalsError=userMessage(e);}
 async function saved(){await load();setNotice('Información comercial guardada localmente.');}
 return <Screen title="Movimientos de Negocio" demo={false} subtitle="Ingresos, gastos, recibos y reservas locales." keyboardForm>
  <ActionButton title="Volver a Negocio" secondary onPress={()=>router.dismissTo('/business')}/><ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  {!store?<Card><Body>Abriendo registros comerciales…</Body></Card>:null}
  <Choices label="Vista por titular legal" value={holderId} options={[["","Seleccionar titular"],...data.holders.map(h=>[h.id,h.legalName] as const)]} onChange={id=>{setHolder(id);setProject('');setNotice('');setLimit(30);}}/>
  {holder?<>
   <Choices label="Vista por proyecto" value={projectId} options={[["","Todos los proyectos del titular"],...projects.map(p=>[p.id,p.name] as const)]} onChange={id=>{setProject(id);setLimit(30);}}/>
   {totals?<Card><SectionHeading title={projectId?projects.find(p=>p.id===projectId)?.name??'Proyecto':'Resumen del titular'} onSurface/>
    <Body>Depósitos netos registrados: {formatMoney(totals.receivedCents)}</Body>
    <Body>Ventas brutas: {knownMoney(totals.grossCents)} · Comisiones: {knownMoney(totals.commissionCents)} · Devoluciones: {knownMoney(totals.refundCents)}</Body>
    <Body>IVU registrado en cobros: {knownMoney(totals.ivuCents)}. No confirma tasas, exenciones ni remesas.</Body>
    <Body>Cobros con desglose pendiente: {totals.pendingIncomeCount}. Los depósitos netos conocidos se conservan; sus componentes desconocidos no se convierten en cero.</Body>
    <Body>Gastos completos registrados: {formatMoney(totals.expenseCents)}</Body>
    <Body>Parte comercial identificada: {formatMoney(totals.commercialExpenseCents)} · Gastos de uso pendiente: {formatMoney(totals.pendingExpenseCents)}</Body>
    <Body>No es un saldo bancario confirmado. Los registros modificados fuera de Negocio o eliminados se muestran para revisar y se excluyen de estos totales. Clasificar como comercial no determina deducibilidad.</Body>
   </Card>:<ErrorNotice message={totalsError}/>}
   {store?<><ActionButton title="Añadir ingreso comercial" testID="business-income" onPress={()=>setForm({kind:'income'})}/><ActionButton title="Registrar gasto comercial" testID="business-expense" onPress={()=>setForm({kind:'expense'})}/></>:null}
   <Card><SectionHeading title="Reservas manuales del titular" onSurface/>
    {(Object.keys(reserveLabels) as ReserveKind[]).map(kind=>{const r=data.reserves.find(r=>r.holderId===holderId&&r.kind===kind);return <Body key={kind}>{reserveLabels[kind]}: {r?formatMoney(r.amountCents):'Sin registrar'}</Body>;})}
    <Body>Las reservas pertenecen al titular, incluso en la vista de proyecto. No crean gastos ni indican que el dinero esté depositado en una cuenta separada.</Body>
    <ActionButton title="Ajustar reservas manuales" secondary onPress={()=>setReserving(true)}/>
   </Card>
   <ActionButton title="Preparar exportación para el CPA" testID="business-export" secondary onPress={()=>{try{businessExport(data,holderId,projectId||null,[]);setExporting(true);}catch(e){setError(userMessage(e));}}}/>
   <SectionHeading title="Registros y recibos"/>
   {!entries.length?<Card><Body>No hay movimientos comerciales en esta vista. Los formularios empiezan en blanco.</Body></Card>:null}
   {entries.slice(0,limit).map(e=>{
    const movement=data.movements.find(m=>m.id===e.movementId),documents=data.documents.filter(d=>d.movementId===e.movementId);
    const share=projectId?entryRows(e).find(a=>a.projectId===projectId):null;
    const commercial=projectId?share?.commercialCents??null:commercialAmount(e);
    return <Card key={e.id}>
     <Body style={{fontWeight:'700'}}>{e.description}</Body><Body>{e.date} · {e.kind==='income'?'Ingreso neto':'Gasto'} · {formatMoney(share?.amountCents??e.amountCents)}</Body>
     {projectId?<Body>Importe del registro completo: {formatMoney(e.amountCents)}. Arriba se muestra únicamente la parte de este proyecto.</Body>:null}
     <Body>Uso: {useLabels[e.useKind]}{e.useKind==='mixed'?` · ${(e.businessBps??0)/100}% comercial`:''} · Parte comercial: {commercial===null?'Pendiente':formatMoney(commercial)}</Body>
     <Body>{e.justification}</Body><Body>{cpaLabels[e.cpaStatus]}</Body>
     {e.stale||e.deletedAt?<Body>{e.deletedAt?'Movimiento eliminado':'Movimiento modificado; conciliación pendiente'}. Excluido de totales.</Body>:null}
     {entryRows(e).map(a=><Body key={a.projectId}>{data.projects.find(p=>p.id===a.projectId)?.name}: {formatMoney(a.amountCents)}</Body>)}
     {documents.map(d=><ActionButton key={d.id} title={`Ver recibo: ${d.description||d.id} · ${receiptStatus(d)}`} secondary onPress={()=>setViewReceipt(d)}/>)}
     {!documents.length?<Body>Comprobante pendiente de adjuntar.</Body>:null}
     {!e.deletedAt?<ActionButton title={`Revisar clasificación y reparto: ${e.description}`} secondary onPress={()=>setForm({kind:e.kind,initial:e})}/>:null}
     {movement&&!e.stale&&!e.deletedAt?<ActionButton title={`Adjuntar recibo: ${e.description}`} secondary onPress={()=>setReceipt(movement)}/>:null}
    </Card>;
   })}
   {entries.length>limit?<ActionButton title="Ver más registros comerciales" secondary onPress={()=>setLimit(limit+30)}/>:null}
  </>:<Card><Body>Selecciona un titular. Si todavía no existe, crea primero su perfil y proyectos en Negocio.</Body></Card>}
  {form&&store&&holder?<BusinessEntryForm holderId={holderId} kind={form.kind} initial={form.initial} data={data} store={store} done={saved} close={()=>setForm(null)}/>:null}
  {receipt?<BusinessReceiptForm movement={receipt} done={saved} close={()=>setReceipt(null)}/>:null}
  {viewReceipt?<ReceiptView document={viewReceipt} close={()=>setViewReceipt(null)}/>:null}
  {reserving&&store&&holder?<BusinessReserveForm holderId={holderId} reserves={data.reserves.filter(r=>r.holderId===holderId)} store={store} done={saved} close={()=>setReserving(false)}/>:null}
  {exporting&&holder?<BusinessExportForm data={data} holderId={holderId} projectId={projectId||null} close={()=>setExporting(false)}/>:null}
 </Screen>;
}
