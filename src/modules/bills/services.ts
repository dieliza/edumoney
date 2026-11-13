import { download } from '../../web/files';
import type { Bill } from './types';
export async function syncReminders(_bills: Bill[]) { return 'En la web, revisa Próximas y Calendario al abrir la app. Los avisos con la app cerrada no están disponibles; puedes descargar la fecha para tu calendario.'; }
export async function enableReminders() { return false; }
export async function calendarCopy(bill: Bill) {
  const date = bill.dueDate.replaceAll('-', '');
  download(`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//EduMoney//Calendario local//ES\r\nBEGIN:VEVENT\r\nUID:${bill.id.replace(/[^a-zA-Z0-9-]/g, '')}@edumoney\r\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}\r\nDTSTART;VALUE=DATE:${date}\r\nSUMMARY:Revisar factura de EduMoney\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n`, 'EduMoney-vencimiento.ics', 'text/calendar');
  return 'Fecha preparada para descargar. Importarla en tu calendario es opcional y no confirma un pago.';
}
