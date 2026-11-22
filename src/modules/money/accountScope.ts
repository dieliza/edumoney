import {useSyncExternalStore} from 'react';
export type AccountScope='personal'|'business';
type ScopeState={value:AccountScope;listeners:Set<()=>void>};
const key=Symbol.for('edumoney.active-account');
function state():ScopeState{const root=globalThis as typeof globalThis&{[key]?:ScopeState};return root[key]??=( {value:'personal',listeners:new Set()} );}
export function getAccountScope(){return state().value;}
export function setAccountScope(value:AccountScope){if(value!=='personal'&&value!=='business'||value===state().value)return;state().value=value;for(const listener of state().listeners)listener();}
export function subscribeAccountScope(listener:()=>void){state().listeners.add(listener);return()=>{state().listeners.delete(listener);};}
export function useAccountScope(){return useSyncExternalStore(subscribeAccountScope,getAccountScope,()=> 'personal' as AccountScope);}
export function legacyCommercialCategory(c:{id:string;name:string}){return c.id.startsWith('edumoney-commercial-')||c.name.trim().toLocaleLowerCase('es')==='comercial';}
