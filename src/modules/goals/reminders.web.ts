export interface GoalReminderStatus{enabled:boolean;message:string}
let status:GoalReminderStatus={enabled:false,message:'Las fechas de tus metas están en Calendario. Activa los recordatorios en este dispositivo para recibir avisos.'};
const listeners=new Set<()=>void>();
export const getGoalReminderStatus=()=>status;
export function subscribeGoalReminders(fn:()=>void){listeners.add(fn);if(typeof window!=='undefined')window.dispatchEvent(new CustomEvent('edumoney-goal-reminder-state',{detail:{complete:publish}}));return()=>{listeners.delete(fn);};}
function publish(next:GoalReminderStatus){status=next;for(const listener of listeners){try{listener();}catch{/* A view must not prevent permission feedback. */}}}
/** Local bridge to the existing payment-push service; never includes goal names or amounts. */
export function requestGoalReminders():Promise<GoalReminderStatus>{return new Promise(resolve=>{let settled=false;const finish=(next:GoalReminderStatus)=>{if(settled)return;settled=true;clearTimeout(timer);publish(next);resolve(next);};const timer=setTimeout(()=>finish({enabled:false,message:'Las fechas se guardaron. Revisa los permisos de avisos en Configuración y vuelve a activar los recordatorios.'}),22000);const event=new CustomEvent('edumoney-enable-goal-reminders',{cancelable:true,detail:{complete:finish}});if(!window.dispatchEvent(event))return;finish({enabled:false,message:'Las fechas están en Calendario. Activa los avisos de pagos en Configuración de este dispositivo.'});});}

if(typeof window!=='undefined')window.addEventListener('edumoney-goal-reminder-status',event=>{const value=(event as CustomEvent<GoalReminderStatus>).detail;if(value&&typeof value.enabled==='boolean'&&typeof value.message==='string')publish(value);});
