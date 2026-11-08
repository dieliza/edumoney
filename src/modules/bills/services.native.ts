import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, AndroidNotificationVisibility, IosAuthorizationStatus } from 'expo-notifications';
// La API de diálogo sin acceso de lectura permanece disponible explícitamente en /legacy en SDK 58.
import { createEventInCalendarAsync, CalendarDialogResultActions } from 'expo-calendar/legacy';
import { ReminderScheduler } from './reminders';
import type { Bill } from './types';
const channelId='edumoney-bills';
Notifications.setNotificationHandler({handleNotification:async()=>({shouldPlaySound:false,shouldSetBadge:false,shouldShowBanner:true,shouldShowList:true})});
const scheduler=new ReminderScheduler({
 permission:async()=>{const p=await Notifications.getPermissionsAsync();return p.granted || p.ios?.status===IosAuthorizationStatus.PROVISIONAL;},
 list:async()=> (await Notifications.getAllScheduledNotificationsAsync()).map(n=>({id:n.identifier,at:Number(n.content.data?.edumoneyAt??NaN)})),
 cancel:id=>Notifications.cancelScheduledNotificationAsync(id),
 schedule:async(id,at)=>{
  if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channelId,{name:'Facturas pendientes',importance:AndroidImportance.DEFAULT,lockscreenVisibility:AndroidNotificationVisibility.PRIVATE});
  await Notifications.scheduleNotificationAsync({identifier:id,content:{title:'EduMoney',body:'Revisa tus facturas pendientes en la aplicación.',data:{edumoneyAt:at},sound:false},trigger:{type:Notifications.SchedulableTriggerInputTypes.DATE,date:new Date(at),channelId}});
 },
});
export function syncReminders(bills:Bill[]){return scheduler.sync(bills,new Date());}
export async function enableReminders(){
 if(Platform.OS==='android')await Notifications.setNotificationChannelAsync(channelId,{name:'Facturas pendientes',importance:AndroidImportance.DEFAULT,lockscreenVisibility:AndroidNotificationVisibility.PRIVATE});
 const result=await Notifications.requestPermissionsAsync({ios:{allowAlert:true,allowSound:false,allowBadge:false}});
 return result.granted;
}
export async function calendarCopy(bill:Bill):Promise<string>{
 // El usuario elige el calendario y confirma en la hoja del SO. Solo se exporta una fecha genérica.
 const start=new Date(`${bill.dueDate}T09:00:00`);const end=new Date(start.getTime()+15*60*1000);
 try {
  const result=await createEventInCalendarAsync({title:'Revisar factura en EduMoney',startDate:start,endDate:end,notes:'Consulta la factura en EduMoney. Este evento no confirma un pago.'});
  if(result.action===CalendarDialogResultActions.canceled)return 'Se cerró el calendario sin confirmar la copia.';
  return 'Se abrió el calendario. Comprueba allí si guardaste el evento. La copia no se actualiza ni elimina desde EduMoney.';
 } catch {
  return 'No se pudo abrir el calendario en este dispositivo. Puedes seguir usando la agenda de Mis facturas; no se modificó ningún pago.';
 }
}
