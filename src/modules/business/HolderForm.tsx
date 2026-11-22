import {announceSaved} from '../../ui/saveFeedback';
import { useState } from 'react';
import { newId } from '../../core/id';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body,Card,SectionHeading } from '../../ui/components';
import { Choices,ErrorNotice,Field } from '../money/fields';
import { legalForms } from './domain';
import type { BusinessProfile,LegalForm } from './types';
import type { BusinessStore } from './store';
export function HolderForm({initial,version,store,done,cancel}:{initial?:BusinessProfile;version:number;store:BusinessStore;done():Promise<void>;cancel():void}) {
 const [id]=useState(()=>initial?.holder.id??newId());
 const [name,setName]=useState(initial?.holder.legalName??'');
 const [form,setForm]=useState<LegalForm|''>(initial?.holder.legalForm??'');
 const [municipality,setMunicipality]=useState(initial?.holder.municipality??'');
 const [merchant]=useState(initial?.holder.merchantNumber??'');
 const [jurisdiction,setJurisdiction]=useState(initial?.holder.llcJurisdiction??'');
 const [members,setMembers]=useState(initial?.holder.llcMembers??'pending');
 const [pr,setPR]=useState(initial?.holder.prClassification??'pending');
 const [federal,setFederal]=useState(initial?.holder.federalClassification??'pending');
 const [dbas,setDBAs]=useState(initial?.dbas??[]);
 const projects=initial?.projects??[];
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save() {
  if (busy) return;
  setBusy(true);setError('');
  try {
   if (!form) throw new UserInputError('Selecciona la forma jurídica.');
   await store.save({holder:{id,legalName:name,legalForm:form,municipality,merchantNumber:merchant,llcJurisdiction:form==='llc'?jurisdiction:null,llcMembers:form==='llc'?members:null,prClassification:pr,federalClassification:federal},dbas,projects},version);
   announceSaved();await done();
  } catch(e) { setError(userMessage(e)); } finally { setBusy(false); }
 }
 return <Card>
  <SectionHeading title={initial?'Editar negocio':'Nuevo negocio'} onSurface/>
  <Body>Los campos empiezan en blanco. Solo se guardan los datos que introduces en este dispositivo.</Body>
  <Field label="Nombre legal" testID="business-legal-name" value={name} onChangeText={setName} maxLength={200}/>
  <Choices required label="Tipo de negocio" value={form} options={legalForms.filter(([key])=>key==='individual'||key==='llc').map(([key])=>[key,key==='individual'?'DBA':'LLC'] as const)} onChange={v=>{if(v!==form){setForm(v);setPR('pending');setFederal('pending');}}}/>
  <Field label="Municipio" testID="business-municipality" value={municipality} onChangeText={setMunicipality}/>

  {form==='llc'?<>
   <Field label="Jurisdicción de constitución de la LLC" testID="business-jurisdiction" value={jurisdiction} onChangeText={setJurisdiction} maxLength={150}/>
   <Choices<'one'|'multiple'|'pending'> label="Miembros de la LLC" value={members} options={[["pending","Pendiente de confirmar"],["one","Un miembro"],["multiple","Varios miembros"]]} onChange={setMembers}/>
   <Body>Completa estos datos tal como aparecen en los documentos de tu LLC.</Body>
  </>:null}
  <SectionHeading title="Nombres comerciales / DBA" onSurface/>
  <Body>Escribe el nombre con el que opera tu negocio, si es distinto del nombre legal.</Body>
  {dbas.map((d,i)=><Field key={d.id} label={`DBA ${i+1}`} testID={`business-dba-${i}`} value={d.name} onChangeText={name=>setDBAs(current=>current.map(x=>x.id===d.id?{...x,name}:x))} maxLength={200}/>)}
  {!busy?<ActionButton title="Añadir nombre comercial" secondary onPress={()=>{const d={id:newId(),holderId:id,name:''};setDBAs(current=>[...current,d]);}}/>:null}
  <ErrorNotice message={error}/>
  {!busy?<><ActionButton title="Guardar perfil comercial" testID="business-save" onPress={()=>void save()}/><ActionButton title="Cancelar edición" secondary onPress={cancel}/></>:<Body>Guardando en este dispositivo…</Body>}
 </Card>;
}
