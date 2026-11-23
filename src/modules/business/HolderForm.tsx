import { useState } from 'react';
import { newId } from '../../core/id';
import { UserInputError,userMessage } from '../../core/errors';
import { ActionButton,Body,Card,SectionHeading } from '../../ui/components';
import { Choices,ErrorNotice,Field } from '../money/fields';
import { classifications,classificationLabels,legalForms } from './domain';
import type { BusinessProfile,LegalForm,Classification } from './types';
import type { BusinessStore } from './store';
import { BusinessFieldHelp } from './BusinessFieldHelp';
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
  <BusinessFieldHelp label="Nombre legal" help={{text:"Es el nombre de la persona o empresa que figura en los documentos del negocio. No es necesariamente el nombre que ven los clientes."}}><Field label="Nombre legal" testID="business-legal-name" value={name} onChangeText={setName} maxLength={200}/></BusinessFieldHelp>
  <BusinessFieldHelp label="Forma jurídica" help={{text:"Es cómo está organizado el negocio en sus documentos. Por ejemplo, una persona puede vender por su cuenta o usar una empresa registrada como LLC. Elige lo que diga tu registro, no lo que diga el rótulo del local."}}><Choices required label="Forma jurídica" value={form} options={legalForms} onChange={v=>{if(v!==form){setForm(v);setPR('pending');setFederal('pending');}}}/></BusinessFieldHelp>
  <Field label="Municipio" testID="business-municipality" value={municipality} onChangeText={setMunicipality}/>
  <BusinessFieldHelp label="Número de comerciante" help={{text:"Es el número que aparece en el Certificado de Registro de Comerciante de Hacienda. No es tu Seguro Social ni tu número de cuenta bancaria. Si no lo tienes a la mano, déjalo vacío."}}><Field label="Número de comerciante (si se conoce)" testID="business-merchant" value={merchant} onChangeText={setMerchant}/></BusinessFieldHelp>
  {form==='llc'?<>
   <BusinessFieldHelp label="Dónde se registró la LLC" help={{text:"Es el lugar donde se creó legalmente la empresa. Por ejemplo, Puerto Rico o Florida. Puede ser distinto del municipio donde vendes."}}><Field label="Jurisdicción de constitución de la LLC" testID="business-jurisdiction" value={jurisdiction} onChangeText={setJurisdiction} maxLength={150}/></BusinessFieldHelp>
   <BusinessFieldHelp label="Miembros de la LLC" help={{text:"Los miembros son los dueños de la LLC. Si eres el único dueño, elige uno; si hay otros dueños, elige varios. No cuentes a los empleados por el hecho de trabajar allí."}}><Choices<'one'|'multiple'|'pending'> label="Miembros de la LLC" value={members} options={[["pending","Pendiente de confirmar"],["one","Un miembro"],["multiple","Varios miembros"]]} onChange={setMembers}/></BusinessFieldHelp>
   <Body>La cantidad de miembros por sí sola no determina la clasificación contributiva de Puerto Rico. Una clasificación federal no se copia a Puerto Rico.</Body>
  </>:null}
  {form?<>
   <BusinessFieldHelp label="Clasificación de Puerto Rico" help={{text:"Es la forma en que Hacienda trata al negocio para las contribuciones. Verifica lo que figure en tus documentos de Puerto Rico. Si no estás seguro, déjalo pendiente."}}><Choices<Classification> label="Clasificación contributiva de Puerto Rico" value={pr} options={classifications(form,'pr').map(v=>[v,classificationLabels[v]] as const)} onChange={setPR}/></BusinessFieldHelp>
   <BusinessFieldHelp label="Clasificación federal" help={{text:"Es la forma en que el IRS trata al negocio para los impuestos federales. Puede ser distinta a la de Hacienda. Usa la clasificación confirmada; no copies la de Puerto Rico automáticamente."}}><Choices<Classification> label="Clasificación contributiva federal" value={federal} options={classifications(form,'federal').map(v=>[v,classificationLabels[v]] as const)} onChange={setFederal}/></BusinessFieldHelp>
   <Body>Selecciona una clasificación confirmada o déjala pendiente. Entidad ignorada es una opción federal de la LLC; no se presume el mismo tratamiento en Puerto Rico. Cambiar la forma jurídica deja ambas clasificaciones pendientes para revisarlas.</Body>
  </>:null}
  <BusinessFieldHelp label="Nombres comerciales (DBA)" help={{text:'Es el nombre con el que te conoce el público. Por ejemplo, tu negocio puede operar con tu nombre personal y anunciarse como Taller del Barrio. Ese nombre comercial no crea otra empresa.'}}>
   <SectionHeading title="Nombres comerciales / DBA" onSurface/>
  </BusinessFieldHelp>
  <Body>Un DBA pertenece a este titular; no crea otro titular legal. Tanto un comerciante individual como una LLC pueden tener varios.</Body>
  {dbas.map((d,i)=><Field key={d.id} label={`DBA ${i+1}`} testID={`business-dba-${i}`} value={d.name} onChangeText={name=>setDBAs(current=>current.map(x=>x.id===d.id?{...x,name}:x))} maxLength={200}/>)}
  {!busy?<ActionButton title="Añadir nombre comercial" secondary onPress={()=>{const d={id:newId(),holderId:id,name:''};setDBAs(current=>[...current,d]);}}/>:null}
  <BusinessFieldHelp label="Proyectos del titular" help={{text:'Un proyecto agrupa ingresos y gastos de una actividad. Por ejemplo, si haces limpieza y también vendes productos, puedes usar un proyecto para cada actividad sin crear otro titular.'}}>
   <SectionHeading title="Proyectos del titular" onSurface/>
  </BusinessFieldHelp>
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
