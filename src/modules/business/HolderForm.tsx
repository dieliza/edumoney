import { useState } from 'react';
import { newId } from '../../core/id';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body,Card,SectionHeading } from '../../ui/components';
import { Choices,ErrorNotice,Field } from '../money/fields';
import { classifications,classificationLabels,legalForms } from './domain';
import type { BusinessProfile,LegalForm,Classification } from './types';
import type { BusinessStore } from './store';
export function HolderForm({initial,version,store,done,cancel}:{initial?:BusinessProfile;version:number;store:BusinessStore;done():Promise<void>;cancel():void}) {
 const [id]=useState(()=>initial?.holder.id??newId());
 const [name,setName]=useState(initial?.holder.legalName??'');
 const [form,setForm]=useState<LegalForm|''>(initial?.holder.legalForm??'');
 const [municipality,setMunicipality]=useState(initial?.holder.municipality??'');
 const [merchant,setMerchant]=useState(initial?.holder.merchantNumber??'');
 const [jurisdiction,setJurisdiction]=useState(initial?.holder.llcJurisdiction??'');
 const [members,setMembers]=useState(initial?.holder.llcMembers??'pending');
 const [pr,setPR]=useState(initial?.holder.prClassification??'pending');
 const [federal,setFederal]=useState(initial?.holder.federalClassification??'pending');
 const [dbas,setDBAs]=useState(initial?.dbas??[]);
 const [projects,setProjects]=useState(initial?.projects??[]);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function save() {
  if (busy) return;
  setBusy(true);setError('');
  try {
   if (!form) throw new UserInputError('Selecciona la forma jurídica.');
   await store.save({holder:{id,legalName:name,legalForm:form,municipality,merchantNumber:merchant,llcJurisdiction:form==='llc'?jurisdiction:null,llcMembers:form==='llc'?members:null,prClassification:pr,federalClassification:federal},dbas,projects},version);
   await done();
  } catch(e) { setError(userMessage(e)); } finally { setBusy(false); }
 }
 return <Card>
  <SectionHeading title={initial?'Editar titular':'Nuevo titular'} onSurface/>
  <Body>Los campos empiezan en blanco. Solo se guardan los datos que introduces en este dispositivo.</Body>
  <Field label="Nombre legal" testID="business-legal-name" value={name} onChangeText={setName} maxLength={200}/>
  <Choices label="Forma jurídica" value={form} options={legalForms} onChange={v=>{if(v!==form){setForm(v);setPR('pending');setFederal('pending');}}}/>
  <Field label="Municipio" testID="business-municipality" value={municipality} onChangeText={setMunicipality}/>
  <Field label="Número de comerciante (si se conoce)" testID="business-merchant" value={merchant} onChangeText={setMerchant}/>
  {form==='llc'?<>
   <Field label="Jurisdicción de constitución de la LLC" testID="business-jurisdiction" value={jurisdiction} onChangeText={setJurisdiction} maxLength={150}/>
   <Choices<'one'|'multiple'|'pending'> label="Miembros de la LLC" value={members} options={[["pending","Pendiente de confirmar"],["one","Un miembro"],["multiple","Varios miembros"]]} onChange={setMembers}/>
   <Body>La cantidad de miembros por sí sola no determina la clasificación contributiva de Puerto Rico. Una clasificación federal no se copia a Puerto Rico.</Body>
  </>:null}
  {form?<>
   <Choices<Classification> label="Clasificación contributiva de Puerto Rico" value={pr} options={classifications(form,'pr').map(v=>[v,classificationLabels[v]] as const)} onChange={setPR}/>
   <Choices<Classification> label="Clasificación contributiva federal" value={federal} options={classifications(form,'federal').map(v=>[v,classificationLabels[v]] as const)} onChange={setFederal}/>
   <Body>Selecciona una clasificación confirmada o déjala pendiente. Entidad ignorada es una opción federal de la LLC; no se presume el mismo tratamiento en Puerto Rico. Cambiar la forma jurídica deja ambas clasificaciones pendientes para revisarlas.</Body>
  </>:null}
  <SectionHeading title="Nombres comerciales / DBA" onSurface/>
  <Body>Un DBA pertenece a este titular; no crea otro titular legal. Tanto un comerciante individual como una LLC pueden tener varios.</Body>
  {dbas.map((d,i)=><Field key={d.id} label={`DBA ${i+1}`} testID={`business-dba-${i}`} value={d.name} onChangeText={name=>setDBAs(current=>current.map(x=>x.id===d.id?{...x,name}:x))} maxLength={200}/>)}
  {!busy?<ActionButton title="Añadir nombre comercial" secondary onPress={()=>{const d={id:newId(),holderId:id,name:''};setDBAs(current=>[...current,d]);}}/>:null}
  <SectionHeading title="Proyectos del titular" onSurface/>
  {!projects.length?<Body>Todavía no hay proyectos. Puedes añadir varios a este titular.</Body>:null}
  {projects.map((p,i)=><Card key={p.id}>
   <Field label={`Nombre del proyecto ${i+1}`} testID={`business-project-${i}`} value={p.name} onChangeText={name=>setProjects(current=>current.map(x=>x.id===p.id?{...x,name}:x))} maxLength={200}/>
   <Choices label={`Nombre comercial del proyecto ${i+1}`} value={p.dbaId??''} options={[["","Directamente con el titular"],...dbas.map(d=>[d.id,d.name.trim()||'DBA pendiente de nombre'] as const)]} onChange={dbaId=>setProjects(current=>current.map(x=>x.id===p.id?{...x,dbaId:dbaId||null}:x))}/>
  </Card>)}
  {!busy?<ActionButton title="Añadir proyecto" secondary onPress={()=>{const p={id:newId(),holderId:id,dbaId:null,name:''};setProjects(current=>[...current,p]);}}/>:null}
  <ErrorNotice message={error}/>
  {!busy?<><ActionButton title="Guardar perfil comercial" testID="business-save" onPress={()=>void save()}/><ActionButton title="Cancelar edición" secondary onPress={cancel}/></>:<Body>Guardando en este dispositivo…</Body>}
 </Card>;
}
