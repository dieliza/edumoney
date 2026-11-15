import {outstanding,shiftDays} from '../bills/domain';
import {minimumRemaining} from '../debts/domain';
import type {Bill} from '../bills/types';
import type {Debt} from '../debts/types';
import type {IncomeSchedule} from '../money/types';
export type InboxNotice={id:string;title:string;body:string;date:string;route:'/bills'|'/debts'|'/money'|'/progress'};
export type InboxSources={bills:Bill[];debts:Debt[];schedules:IncomeSchedule[];awards:{id:string;title:string;basis:string;earnedAt:string}[]};
/** Solo proyecta avisos de registros existentes; nunca confirma ni duplica operaciones. */
export function inboxNotices(data:InboxSources,today:string):InboxNotice[]{const items:InboxNotice[]=[];const represented=new Set<string>();
 for(const b of data.bills){if(b.voidedAt||outstanding(b)<=0)continue;const start=b.reminderDays===null?b.dueDate:shiftDays(b.dueDate,-b.reminderDays);if(start>today)continue;if(b.debtId)represented.add(`${b.debtId}:${b.dueDate}`);items.push({id:`bill:${b.id}:${b.dueDate}`,title:b.dueDate<today?'Factura con vencimiento pasado':b.dueDate===today?'Factura que vence hoy':'Próxima factura',body:`${b.provider} · Vencimiento registrado: ${b.dueDate}. Revisa el pendiente y confirma los pagos en ${b.debtId?'Deudas':'Mis facturas'}.`,date:start,route:b.debtId?'/debts':'/bills'});}
 for(const d of data.debts){if(represented.has(`${d.id}:${d.dueDate}`)||d.archived||d.balanceCents<=0||!d.dueDate||d.dueDate>today||minimumRemaining(d)===0)continue;items.push({id:`debt:${d.id}:${d.dueDate}`,title:d.dueDate===today?'Deuda con vencimiento hoy':'Revisar vencimiento de deuda',body:`${d.name} · ${d.dueDate}. Revisa el estado registrado y sus pagos en Deudas.`,date:d.dueDate,route:'/debts'});}
 for(const s of data.schedules){if(!s.active||s.nextDate>today)continue;items.push({id:`income:${s.id}:${s.nextDate}`,title:'Cobro programado por confirmar',body:`${s.description} · Fecha prevista: ${s.nextDate}. Abre Ingreso → Administrar cobros programados para confirmar si lo recibiste.`,date:s.nextDate,route:'/money'});}
 for(const a of data.awards)items.push({id:`award:${a.id}`,title:`Logro obtenido: ${a.title}`,body:a.basis,date:a.earnedAt.slice(0,10),route:'/progress'});
 return [...new Map(items.map(n=>[n.id,n])).values()].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
}
