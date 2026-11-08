import { reminderPlan } from './domain';
import type { Bill } from './types';
export interface ReminderPort {
 permission():Promise<boolean>;
 list():Promise<{id:string;at:number}[]>;
 cancel(id:string):Promise<void>;
 schedule(id:string,at:number):Promise<void>;
}
/** La cola evita que dos refrescos de pantallas dejen avisos obsoletos tras un pago. */
export class ReminderScheduler {
 private queue:Promise<unknown>=Promise.resolve();
 constructor(private port:ReminderPort){}
 sync(bills:Bill[],now:Date):Promise<string>{
  const next=this.queue.then(()=>this.reconcile(bills,now));this.queue=next.catch(()=>undefined);return next;
 }
 private async reconcile(bills:Bill[],now:Date){
  const plan=reminderPlan(bills,now);
  const allowed=await this.port.permission();
  const desired=allowed?plan.reminders:[];
  const previous=(await this.port.list()).filter(n=>n.id.startsWith('edumoney-bill:'));
  for(const old of previous)if(!desired.some(n=>n.id===old.id && n.at===old.at))await this.port.cancel(old.id);
  for(const n of desired)if(!previous.some(old=>old.id===n.id && old.at===n.at))await this.port.schedule(n.id,n.at);
  if(!allowed)return 'Avisos locales desactivados o sin permiso. Tus facturas siguen disponibles aquí.';
  return `${desired.length} aviso(s) local(es) programado(s) a las 9:00. ${plan.deferred?`${plan.deferred} quedan fuera del cupo; se incorporan al abrir la app cuando haya espacio. `:''}Los avisos cuya hora ya pasó no se envían retroactivamente. El sistema puede retrasarlos.`;
 }
}
