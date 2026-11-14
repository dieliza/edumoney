import {monthlySummary,validMonth} from './domain';
import type {Snapshot} from './types';
import type {ExpenseSlice} from '../../ui/expenseSegments';
export function expenseBreakdown<T extends ExpenseSlice>(items:readonly T[]){return items.filter(c=>c.spent>0).sort((a,b)=>b.spent-a.spent||a.name.localeCompare(b.name,'es')||a.id.localeCompare(b.id));}
export function topExpenses<T extends ExpenseSlice>(items:readonly T[]){return expenseBreakdown(items).slice(0,3);}
export function analysisMonths(end:string,count:number){if(!validMonth(end)||![6,12].includes(count))throw Error('Elige un mes válido y un intervalo de seis o doce meses.');const base=Number(end.slice(0,4))*12+Number(end.slice(5))-1;return Array.from({length:count},(_,i)=>base-count+1+i).map(m=>`${Math.floor(m/12).toString().padStart(4,'0')}-${String(m%12+1).padStart(2,'0')}`).filter(validMonth);}
/** Presentación histórica: reutiliza exactamente los totales financieros existentes. */
export function historicalSeries(snapshot:Snapshot,end:string,count:number,category='all'){return analysisMonths(end,count).map(month=>{const summary=monthlySummary(snapshot,month);return {month,income:summary.income,expenses:summary.expenses,category:category==='all'?null:summary.distribution.find(c=>c.id===category)?.spent??0,hasRecords:snapshot.movements.some(m=>!m.deletedAt&&m.date.startsWith(month))};});}
