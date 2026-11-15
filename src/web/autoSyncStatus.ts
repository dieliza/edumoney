import type {AutoSyncStatus} from './autoSyncController';
let status:AutoSyncStatus={state:'waiting',message:'Preparando respaldo automático…'};
const listeners=new Set<()=>void>();
export const autoSyncSnapshot=()=>status;
export const subscribeAutoSync=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
export function updateAutoSync(value:AutoSyncStatus){status={...value,lastSuccess:value.lastSuccess??status.lastSuccess};listeners.forEach(fn=>fn());}
