import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { nextOccurrence, validDate } from '../money/domain';
import type { Bill, BillInput, BillSeries, Cadence } from './types';
export function shiftDays(date: string, days: number): string {
 if (!validDate(date) || !Number.isInteger(days)) throw new UserInputError('Fecha o intervalo no válido.');
 const d = new Date(`${date}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days);
 const value = d.toISOString().slice(0,10);
 if (!validDate(value)) throw new UserInputError('Fecha fuera del rango admitido.');
 return value;
}
export function nextBillDate(s: Pick<BillSeries,'anchorDate'|'nextDate'|'cadence'|'intervalCount'>): string {
 if (!Number.isInteger(s.intervalCount) || s.intervalCount < 1 || s.intervalCount > 365 || !validDate(s.anchorDate) || !validDate(s.nextDate)) throw new UserInputError('Recurrencia no válida.');
 if (s.cadence === 'days') return shiftDays(s.nextDate, s.intervalCount);
 if (!['weekly','monthly'].includes(s.cadence)) throw new UserInputError('Frecuencia no válida.');
 // La rutina de ingresos admite hasta 120; las facturas permiten hasta 365 intervalos.
 if (s.intervalCount <= 120) return nextOccurrence({ ...s, cadence: s.cadence, id: '', description: '', amountCents: cents(1), categoryId: null, paymentMethod: null, active: true });
 if (s.cadence === 'weekly') return shiftDays(s.nextDate, 7*s.intervalCount);
 const d = new Date(`${s.nextDate.slice(0,7)}-01T12:00:00Z`); d.setUTCMonth(d.getUTCMonth()+s.intervalCount);
 const last = new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();
 d.setUTCDate(Math.min(Number(s.anchorDate.slice(8)),last));
 const value=d.toISOString().slice(0,10); if(!validDate(value)) throw new UserInputError('Fecha fuera del rango admitido.'); return value;
}
export function validateBill(b: BillInput) {
 if (!b.id || !b.provider.trim() || b.provider.length>100 || !validDate(b.dueDate)) throw new UserInputError('Revisa proveedor y vencimiento (AAAA-MM-DD).');
 if (cents(b.amountCents)<=0) throw new UserInputError('El importe debe ser positivo.');
 if (!['expense','debt_payment'].includes(b.paymentKind) || b.paymentKind==='debt_payment' && b.categoryId!==null) throw new UserInputError('Un pago de tarjeta o deuda no lleva categoría de compra.');
 if (b.reminderDays!==null && (!Number.isInteger(b.reminderDays) || b.reminderDays<0 || b.reminderDays>30)) throw new UserInputError('El aviso debe ser de 0 a 30 días antes, o sin aviso.');
 if(b.reminderDays!==null)shiftDays(b.dueDate,-b.reminderDays);
}
export const cadenceLabels: Record<Cadence,string> = { weekly:'Semanas', monthly:'Meses', days:'Días' };
export function outstanding(b: Bill) { return cents(b.amountCents-b.paidCents); }
export function billStatus(b: Bill,today:string):string {
 if(b.voidedAt) return 'Anulada';
 if(!outstanding(b)) return 'Pagada';
 const status = b.dueDate<today ? 'Atrasada' : b.dueDate===today ? 'Vence hoy' : 'Pendiente';
 return b.paidCents ? `${status} · Pago parcial` : status;
}
export function reminderPlan(bills: Bill[], now: Date, limit=48) {
 const eligible = bills.flatMap(b=>{
  if(b.voidedAt || !outstanding(b) || b.reminderDays===null) return [];
  const day=shiftDays(b.dueDate,-b.reminderDays);
  // Hora civil local: el aviso sigue la zona del dispositivo al reprogramar al abrir la app.
  const date=new Date(`${day}T09:00:00`);
  return date.getTime()>now.getTime() ? [{id:`edumoney-bill:${b.id}`, at:date.getTime()}] : [];
 }).sort((a,b)=>a.at-b.at || a.id.localeCompare(b.id));
 return { reminders:eligible.slice(0,limit), deferred:Math.max(0,eligible.length-limit) };
}
