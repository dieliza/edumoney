import { useEffect, type PropsWithChildren } from 'react';
import { AppState } from 'react-native';
import { refreshBills } from './runtime';
export function BillsLifecycle({children}:PropsWithChildren){
 useEffect(()=>{
  // No solicita permisos automáticamente. El estado se consulta en Mis facturas.
  const refresh=()=>{void refreshBills().catch(()=>undefined);};refresh();
  const subscription=AppState.addEventListener('change',state=>{if(state==='active')refresh();});
  return ()=>subscription.remove();
 },[]);
 return children;
}
