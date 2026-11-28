import AsyncStorage from '@react-native-async-storage/async-storage';
import {useSyncExternalStore} from 'react';
export type DashboardDesign='original'|'futuristic';
export const DASHBOARD_KEY='edumoney.dashboard.v1';
export const parseDashboard=(value:string|null):DashboardDesign=>value==='futuristic'?'futuristic':'original';
/** Visual preference only; use the same serialized storage contract as appearance. */
export function createDashboardPreference(storage:{getItem(k:string):Promise<string|null>;setItem(k:string,v:string):Promise<void>}){
 let value:DashboardDesign='original',notice='',started=false,pending=Promise.resolve(),revision=0;
 const listeners=new Set<()=>void>(),emit=()=>listeners.forEach(fn=>fn());
 return {read:()=>value,notice:()=>notice,subscribe(fn:()=>void){listeners.add(fn);if(!started){started=true;const at=revision;void storage.getItem(DASHBOARD_KEY).then(raw=>{if(at===revision){value=parseDashboard(raw);emit();}}).catch(()=>{notice='No pudimos recuperar el diseño guardado.';emit();});}return()=>{listeners.delete(fn);};},set(next:DashboardDesign){revision++;value=next;emit();pending=pending.catch(()=>{}).then(()=>storage.setItem(DASHBOARD_KEY,next)).then(()=>{notice='';emit();}).catch(()=>{notice='El diseño cambió, pero no pudo guardarse. Vuelve a seleccionarlo para reintentar.';emit();});return pending;}};
}
const preference=createDashboardPreference(AsyncStorage);
export function useDashboardDesign(){const design=useSyncExternalStore(preference.subscribe,preference.read,()=> 'original' as DashboardDesign),notice=useSyncExternalStore(preference.subscribe,preference.notice,()=> '');return {design,notice,setDesign:preference.set};}
