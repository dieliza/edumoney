import {useEffect,useRef,useState} from 'react';
import {ActionButton,Body,Card,SectionHeading} from '../../ui/components';
import {Choices,ErrorNotice,Field} from '../money/fields';
import {getMoneyStore} from '../money/localStore';
import {JurisdictionStore} from './store';
import {jurisdictions,type JurisdictionProfile} from './domain';
import {activateResearch} from './service';
export function JurisdictionPanel({changed}:{changed?():void}){
 const [profile,setProfile]=useState<JurisdictionProfile>({residence:'PR',work:'PR',year:new Date().getFullYear()}),[saved,setSaved]=useState<JurisdictionProfile|null>(null),[editing,setEditing]=useState(false),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const saving=useRef(false);
 useEffect(()=>{let live=true;void getMoneyStore().then(s=>new JurisdictionStore(s).read()).then(p=>{if(live){if(p){setProfile(p);setSaved(p);}setReady(true);}}).catch(()=>{if(live)setError('No pudimos cargar la residencia contributiva.');});return()=>{live=false;};},[]);
 async function save(){
  if(saving.current)return;
  saving.current=true;setBusy(true);setError('');
  try{
   await new JurisdictionStore(await getMoneyStore()).save(profile);
   setSaved({...profile});setEditing(false);setMessage('Residencia contributiva guardada para todas tus cuentas IRA. Investigación pendiente de validación.');changed?.();
   await Promise.all([...new Set([profile.residence,profile.work])].map(j=>activateResearch(j,profile.year)));
   setMessage('Jurisdicción guardada. Investigación solicitada; los cálculos nuevos esperan validación y aprobación del propietario.');
  }catch(e){setError(e instanceof Error?e.message:'Investigación pendiente.');}
  finally{saving.current=false;setBusy(false);}
 }
 const form=ready&&(!saved||editing),label=(id:string)=>jurisdictions.find(([key])=>key===id)?.[1]??id;
 return <Card><SectionHeading title="Residencia contributiva" onSurface/>{form?<><Body>Se configura una vez para todas tus cuentas IRA. Indica dónde resides contributivamente y dónde trabajas; no es la ubicación de la institución financiera. Si son distintas, deben revisarse las reglas de ambas jurisdicciones.</Body><Choices label="Dónde resides contributivamente" options={jurisdictions} value={profile.residence} onChange={residence=>setProfile({...profile,residence})}/><Choices label="Jurisdicción donde trabajas" options={jurisdictions} value={profile.work} onChange={work=>setProfile({...profile,work})}/><Field label="Año contributivo" value={String(profile.year)} onChangeText={s=>setProfile({...profile,year:Number(s)})}/></>:saved?<><Body>Residencia: {label(saved.residence)} · Trabajo: {label(saved.work)} · Año: {saved.year}</Body><Body>Configuración compartida por tus cuentas IRA; no debes completarla al crear otra cuenta.</Body></>:null}<ErrorNotice message={error}/>{message?<Body>{message}</Body>:null}{ready&&!busy?<ActionButton title={form?'Guardar jurisdicción e investigar':'Editar residencia contributiva'} onPress={()=>{if(form)void save();else{setProfile({...saved!});setEditing(true);}}}/>:null}</Card>;
}
