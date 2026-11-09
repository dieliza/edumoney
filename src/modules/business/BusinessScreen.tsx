import { useCallback,useEffect,useState } from 'react';
import { router,useIsFocused } from 'expo-router';
import { ActionButton,Body,Card,Screen } from '../../ui/components';
import { ErrorNotice } from '../money/fields';
import { getMoneyStore } from '../money/localStore';
import { userMessage } from '../../core/errors';
import { BusinessStore } from './store';
import { HolderForm } from './HolderForm';
import { classificationLabels,legalForms } from './domain';
import type { BusinessSnapshot } from './types';
const empty:BusinessSnapshot={holders:[],dbas:[],projects:[]};
export default function BusinessScreen() {
 const focused=useIsFocused();
 const [store,setStore]=useState<BusinessStore>();
 const [data,setData]=useState(empty),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [editing,setEditing]=useState<string|null>('new');
 const load=useCallback(async()=>{const s=new BusinessStore(await getMoneyStore());const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;let active=true;void getMoneyStore().then(async ledger=>{const s=new BusinessStore(ledger);const d=await s.snapshot();if(active){setStore(s);setData(d);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[focused]);
 const holder=data.holders.find(h=>h.id===editing);
 return <Screen title="Negocio" subtitle="Titulares, nombres comerciales y proyectos." demo={false} keyboardForm>
  <ErrorNotice message={error}/>{notice?<Card><Body>{notice}</Body></Card>:null}
  <Card><Body>Organiza cada titular legal por separado. Los perfiles se guardan en el almacenamiento local cifrado de EduMoney, sin exigir una cuenta en línea.</Body></Card>
  {!store?<Card><Body>Abriendo perfiles locales…</Body></Card>:editing?<HolderForm key={editing} store={store} version={holder?.version??0} initial={holder?{holder,dbas:data.dbas.filter(d=>d.holderId===holder.id),projects:data.projects.filter(p=>p.holderId===holder.id)}:undefined} cancel={()=>setEditing(null)} done={async()=>{await load();setEditing(null);setNotice('Perfil comercial guardado localmente.');}}/>:<ActionButton title="Añadir titular" testID="business-create" onPress={()=>{setNotice('');setEditing('new');}}/>}
  {!data.holders.length?<Card><Body>No hay titulares guardados. No se crean perfiles de ejemplo automáticamente.</Body></Card>:null}
  {data.holders.map(h=><Card key={h.id}>
   <Body style={{fontWeight:'700',fontSize:20}}>{h.legalName}</Body>
   <Body>{legalForms.find(([v])=>v===h.legalForm)?.[1]} · {h.municipality||'Municipio pendiente'}</Body>
   {h.legalForm==='llc'?<Body>Constitución: {h.llcJurisdiction} · Miembros: {h.llcMembers==='one'?'uno':h.llcMembers==='multiple'?'varios':'pendiente'}</Body>:null}
   <Body>Puerto Rico: {classificationLabels[h.prClassification]}</Body><Body>Federal: {classificationLabels[h.federalClassification]}</Body>
   <Body>DBA: {data.dbas.filter(d=>d.holderId===h.id).map(d=>d.name).join(', ')||'Sin registrar'}</Body>
   {data.projects.filter(p=>p.holderId===h.id).map(p=><Body key={p.id}>Proyecto: {p.name} · {p.dbaId?data.dbas.find(d=>d.id===p.dbaId)?.name:'Directamente con el titular'}</Body>)}
   <ActionButton title={`Abrir perfil: ${h.legalName}`} secondary onPress={()=>{setNotice('');setEditing(h.id);}}/>
   <ActionButton title={`Movimientos y recibos: ${h.legalName}`} onPress={()=>router.push({pathname:'/business-ledger',params:{holderId:h.id}})}/>
   <ActionButton title={`IVU y contratistas: ${h.legalName}`} secondary onPress={()=>router.push({pathname:'/business-obligations',params:{holderId:h.id}})}/>
  </Card>)}
 </Screen>;
}
