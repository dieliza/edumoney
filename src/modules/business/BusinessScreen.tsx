import { View } from 'react-native';
import { useCallback,useEffect,useState } from 'react';
import { router,useIsFocused } from 'expo-router';
import { ActionButton,Body,Card,DashboardAction,IconBadge,Screen } from '../../ui/components';
import { ErrorNotice } from '../money/fields';
import { getMoneyStore } from '../money/localStore';
import { userMessage } from '../../core/errors';
import { BusinessStore } from './store';
import { HolderForm } from './HolderForm';
import { legalForms } from './domain';
import type { BusinessSnapshot } from './types';
const empty:BusinessSnapshot={holders:[],dbas:[],projects:[]};
export default function BusinessScreen() {
 const focused=useIsFocused();
 const [store,setStore]=useState<BusinessStore>();
 const [data,setData]=useState(empty),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [expanded,setExpanded]=useState<string|null>(null);
 const [editing,setEditing]=useState<string|null>(null);
 const load=useCallback(async()=>{const s=new BusinessStore(await getMoneyStore());const d=await s.snapshot();setStore(s);setData(d);},[]);
 useEffect(()=>{if(!focused)return;let active=true;void getMoneyStore().then(async ledger=>{const s=new BusinessStore(ledger);const d=await s.snapshot();if(active){setStore(s);setData(d);}}).catch(e=>{if(active)setError(userMessage(e));});return()=>{active=false;};},[focused]);
 const holder=data.holders.find(h=>h.id===editing);
 return <Screen title="Negocio" subtitle="Organiza tu DBA o LLC." demo={false} keyboardForm>
  <ErrorNotice message={error}/>{notice?<Card row><Body>{notice}</Body></Card>:null}
  <Card row><Body>Elige DBA o LLC y registra los ingresos, gastos y empleados de tu negocio.</Body></Card>
  {!store?<Card row><Body>Abriendo perfiles locales…</Body></Card>:editing?<HolderForm key={editing} store={store} version={holder?.version??0} initial={holder?{holder,dbas:data.dbas.filter(d=>d.holderId===holder.id),projects:data.projects.filter(p=>p.holderId===holder.id)}:undefined} cancel={()=>setEditing(null)} done={async()=>{await load();setEditing(null);setNotice('Perfil comercial guardado localmente.');}}/>:<ActionButton title="Añadir DBA o LLC" testID="business-create" onPress={()=>{setNotice('');setEditing('new');}}/>}
  {!data.holders.length?<Card row><Body>No hay titulares guardados. No se crean perfiles de ejemplo automáticamente.</Body></Card>:null}
  {data.holders.map(h=><Card row key={h.id}>
   <View style={{flexDirection:'row',alignItems:'center',gap:12,minWidth:240,flexGrow:1}}><IconBadge icon="briefcase"/><Body style={{fontWeight:'700',fontSize:20,flex:1}}>{h.legalName}</Body></View>
   <Body>{h.legalForm==='individual'?'DBA':legalForms.find(([v])=>v===h.legalForm)?.[1]} · {h.municipality||'Municipio pendiente'}</Body>
   {h.legalForm==='llc'?<Body>Constitución: {h.llcJurisdiction} · Miembros: {h.llcMembers==='one'?'uno':h.llcMembers==='multiple'?'varios':'pendiente'}</Body>:null}

   <Body>DBA: {data.dbas.filter(d=>d.holderId===h.id).map(d=>d.name).join(', ')||'Sin registrar'}</Body>
   {['individual','llc'].includes(h.legalForm)?<ActionButton title="Editar negocio" secondary onPress={()=>{setNotice('');setEditing(h.id);}}/>:<Body>Perfil anterior: sus registros se conservan.</Body>}
   <View style={{flexDirection:'row',flexWrap:'wrap',gap:12,flexBasis:'100%'}}>
    <DashboardAction title="Transacciones y recibos" accessibilityLabel={`Transacciones y recibos: ${h.legalName}`} icon="receipt" onPress={()=>router.push({pathname:'/business-ledger',params:{holderId:h.id}})}/>
    <DashboardAction title="Nómina" accessibilityLabel={`Nómina: ${h.legalName}`} icon="people" tone="coral" onPress={()=>router.push({pathname:'/business-payroll',params:{holderId:h.id}})}/>
   </View>
   <ActionButton title={expanded===h.id?'Cerrar documentos y herramientas':'Documentos y herramientas'} secondary onPress={()=>setExpanded(expanded===h.id?null:h.id)}/>
   {expanded===h.id?<View style={{gap:8}}>
    <ActionButton title="Para el contable" secondary onPress={()=>router.push('/tax')}/>
    <ActionButton title="Cheques y talonarios" secondary onPress={()=>router.push({pathname:'/income-documents',params:{context:'business'}})}/>
    <ActionButton title="IVU y contratistas" secondary onPress={()=>router.push({pathname:'/business-obligations',params:{holderId:h.id}})}/>
   </View>:null}
  </Card>)}
 </Screen>;
}
