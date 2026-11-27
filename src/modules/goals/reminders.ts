import {enableReminders} from '../bills/services';
export interface GoalReminderStatus{enabled:boolean;message:string}
let status:GoalReminderStatus={enabled:false,message:'Las fechas de tus metas están en Calendario.'};
export const getGoalReminderStatus=()=>status;
export function subscribeGoalReminders(_fn:()=>void){return()=>{};}
export async function requestGoalReminders(){const enabled=await enableReminders();status={enabled,message:enabled?'Permiso de recordatorios concedido.':'Las fechas están guardadas. Revisa el permiso de notificaciones del dispositivo.'};return status;}
