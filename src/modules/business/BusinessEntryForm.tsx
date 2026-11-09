import { useState } from 'react';
import { newId } from '../../core/id';
import { parseAmount } from '../../core/money';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body } from '../../ui/components';
import { Choices,ErrorNotice,Field,Sheet } from '../money/fields';
import { formatMoney } from '../money/domain';
import { decimal } from '../tax/domain';
import { useLabels,cpaLabels,netDeposit } from './ledgerDomain';
import type { BusinessLedgerStore } from './ledgerStore';
import type { BusinessEntry,BusinessLedgerSnapshot,BusinessUse,CPAStatus } from './ledgerTypes';
export function BusinessEntryForm({holderId,kind,initial,data,store,done,close}:{holderId:string;kind:'income'|'expense';initial?:BusinessEntry;data:BusinessLedgerSnapshot;store:BusinessLedgerStore;done():Promise<void>;close():void}) {
 const [id]=useState(()=>initial?.id??newId());
 const [source,setSource]=useState(initial?'existing':'new');
 const [movementId,setMovementId]=useState(initial?.movementId??'');
 const [search,setSearch]=useState('');
 const [date,setDate]=useState(''),[description,setDescription]=useState(''),[amount,setAmount]=useState(''),[method,setMethod]=useState('');
 const [useKind,setUse]=useState<BusinessUse>(initial?.useKind??(kind==='income'?'business':'pending'));
 const [percent,setPercent]=useState(initial?.businessBps===null||!initial?'':decimal(initial.businessBps));
 const [justification,setJustification]=useState(initial?.justification??'');
 const [cpa,setCPA]=useState<CPAStatus>(initial?.cpaStatus??'pending');
 const [gross,setGross]=useState(initial?.grossCents===null||!initial?'':decimal(initial.grossCents));
 const [commission,setCommission]=useState(initial?.commissionCents===null||!initial?'':decimal(initial.commissionCents));
 const [refund,setRefund]=useState(initial?.refundCents===null||!initial?'':decimal(initial.refundCents));
 const [ivu,setIVU]=useState(initial?.ivuCents===null||!initial?'':decimal(initial.ivuCents));
 const [allocations,setAllocations]=useState<Record<string,string>>(()=>Object.fromEntries(initial?.allocations.map(a=>[a.projectId,decimal(a.amountCents)])??[]));
 const [reason,setReason]=useState(''),[similar,setSimilar]=useState('no'),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const projects=data.projects.filter(p=>p.holderId===holderId);
 const targets=data.movements.filter(m=>!m.deletedAt&&m.kind===kind&&(!data.entries.some(e=>e.movementId===m.id)||m.id===initial?.movementId));
 const selected=targets.find(m=>m.id===movementId);
 const optional=(value:string)=>value.trim()?parseAmount(value.trim()):null;
 let net:number|null=null;try{net=netDeposit({grossCents:optional(gross),commissionCents:optional(commission),refundCents:optional(refund),ivuCents:optional(ivu)});}catch{/* Los errores detallados se muestran al guardar. */}
 async function save(){if(busy)return;setBusy(true);setError('');try{
  if(source==='existing'&&!selected)throw new UserInputError('Selecciona un movimiento existente.');
  await store.save({id,holderId,kind,date:selected&&source==='existing'?selected.date:date.trim(),description:selected&&source==='existing'?selected.description:description,amountCents:selected&&source==='existing'?selected.amountCents:parseAmount(amount.trim()),paymentMethod:selected&&source==='existing'?selected.paymentMethod??'':method,existingMovementId:source==='existing'?selected!.id:null,expectedMovementVersion:source==='existing'?selected!.version:null,useKind:kind==='income'?'business':useKind,businessBps:kind==='expense'&&useKind==='mixed'?optional(percent):null,justification,cpaStatus:cpa,grossCents:kind==='income'?optional(gross):null,commissionCents:kind==='income'?optional(commission):null,refundCents:kind==='income'?optional(refund):null,ivuCents:kind==='income'?optional(ivu):null,allocations:projects.filter(p=>allocations[p.id]?.trim()).map(p=>({projectId:p.id,amountCents:parseAmount(allocations[p.id].trim())})),confirmSimilar:similar==='yes'},initial?.version??0,reason);
  await done();close();
 }catch(e){setError(userMessage(e));}finally{setBusy(false);}}
 return <Sheet title={initial?'Revisar registro comercial':kind==='income'?'Ingreso comercial':'Gasto comercial'} close={close} busy={busy}>
  {!initial?<Choices label="Origen del registro" value={source} options={[["new","Crear movimiento nuevo"],["existing","Vincular movimiento existente"]]} onChange={setSource}/>:<Body>Esta revisión conserva el titular y movimiento originales. Para corregir importe, fecha o método, corrige primero el movimiento en Mi dinero y vuelve a conciliar aquí.</Body>}
  {source==='existing'?<><Field label="Buscar movimiento existente" value={search} onChangeText={setSearch}/><Choices label="Movimiento a vincular" value={movementId} options={[["","Seleccionar movimiento"],...targets.filter(m=>`${m.date} ${m.description}`.toLowerCase().includes(search.toLowerCase())).slice(0,30).map(m=>[m.id,`${m.date} · ${m.description} · ${formatMoney(m.amountCents)}`] as const)]} onChange={v=>{if(!initial)setMovementId(v);}}/>{selected?<Body>{selected.date} · {selected.description} · {formatMoney(selected.amountCents)}. Se vincula una sola vez.</Body>:null}</>:<>
   <Field label="Fecha AAAA-MM-DD" testID="business-entry-date" value={date} onChangeText={setDate}/>
   <Field label="Descripción" testID="business-entry-description" value={description} onChangeText={setDescription} maxLength={240}/>
   <Field label={kind==='income'?'Depósito neto recibido USD':'Importe total del gasto USD'} testID="business-entry-amount" value={amount} onChangeText={setAmount} decimal/>
   <Choices label="Método de pago" value={method} options={[["","Seleccionar método"],["bank","Transferencia bancaria"],["cash","Efectivo"],["debit","Tarjeta de débito"],["other","Otro"],...(kind==='expense'?[["credit","Tarjeta de crédito"]] as const:[])]} onChange={setMethod}/>
  </>}
  {kind==='income'?<>
   <Body>El neto se registra una vez en Mi dinero. Este desglose explica el mismo cobro: brutas − comisiones − devoluciones + IVU. No calcula una tasa ni determina si debes cobrar IVU.</Body>
   <Field label="Ventas brutas USD" testID="business-gross" value={gross} onChangeText={setGross} decimal/>
   <Field label="Comisiones descontadas USD" value={commission} onChangeText={setCommission} decimal/>
   <Field label="Devoluciones descontadas USD" value={refund} onChangeText={setRefund} decimal/>
   <Field label="IVU registrado en este cobro USD" value={ivu} onChangeText={setIVU} decimal/>
   <Body>Neto del desglose: {net===null?'Pendiente de los componentes':formatMoney(net)}. Un campo vacío queda pendiente; escribe cero solo cuando lo confirmaste. El depósito conocido se puede guardar mientras completas el desglose.</Body>
  </>:<>
   <Choices<BusinessUse> label="Uso del gasto" value={useKind} options={Object.entries(useLabels) as [BusinessUse,string][]} onChange={setUse}/>
   {useKind==='mixed'?<><Field label="Porcentaje comercial (hasta dos decimales)" testID="business-percent" value={percent} onChangeText={setPercent} decimal/><Body>El resto se conserva como parte personal; no se elimina del recibo ni se suma otra vez.</Body></>:null}
  </>}
  <Field label={useKind==='mixed'?'Justificación del porcentaje comercial':'Justificación o nota'} value={justification} onChangeText={setJustification} multiline maxLength={2000}/>
  <Choices<CPAStatus> label="Estado de revisión del CPA" value={cpa} options={Object.entries(cpaLabels) as [CPAStatus,string][]} onChange={setCPA}/>
  <Body>La clasificación comercial no confirma deducibilidad. El estado de revisión no impide guardar ni calcular el reparto.</Body>
  <Body style={{fontWeight:'700'}}>Reparto entre proyectos</Body><Body>Escribe el importe de cada proyecto. La suma debe coincidir exactamente con el neto recibido o el gasto completo. Deja en blanco los proyectos que no participan.</Body>
  {!projects.length?<Body>Crea primero un proyecto para este titular en su perfil.</Body>:null}
  {projects.map(p=><Field key={p.id} label={`Importe para ${p.name} USD`} value={allocations[p.id]??''} onChangeText={value=>setAllocations(current=>({...current,[p.id]:value}))} decimal/>)}
  {initial?<Field label="Motivo de la revisión comercial" value={reason} onChangeText={setReason} maxLength={2000}/>:source==='new'?<Choices label="Registros similares" value={similar} options={[["no","Revisar antes de duplicar"],["yes","Confirmo que es otro registro distinto"]]} onChange={setSimilar}/>:null}
  <ErrorNotice message={error}/>{!busy?<ActionButton title="Guardar registro comercial" testID="business-entry-save" onPress={()=>void save()}/>:null}
 </Sheet>;
}
