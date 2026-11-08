import { localToday } from '../money/domain';
import { getBillsStore } from './localStore';
import { syncReminders } from './services';
let queue:Promise<unknown>=Promise.resolve();
/** Se vuelve a leer dentro de la cola: un refresco antiguo no puede reinstalar avisos ya pagados. */
export function refreshBills(){
 const next=queue.then(async()=>{
  const store=await getBillsStore();await store.materialize(localToday());const data=await store.snapshot();
  let reminderMessage:string;
  try{reminderMessage=await syncReminders(data.bills);}catch{reminderMessage='No se pudieron actualizar los avisos. Revisa permisos y vuelve a intentarlo; los datos financieros están conservados.';}
  return {store,data,reminderMessage};
 });queue=next.catch(()=>undefined);return next;
}
