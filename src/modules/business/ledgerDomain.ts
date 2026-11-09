import { cents,addAmounts } from '../../core/money';
import { UserInputError } from '../../core/errors';
import { validDate } from '../money/domain';
import { csvCell } from '../tax/domain';
import type { Allocation,BusinessEntry,BusinessLedgerSnapshot,EntryInput } from './ledgerTypes';
export const useLabels={business:'Comercial',personal:'Personal',mixed:'Mixto',pending:'Pendiente'} as const;
export const cpaLabels={pending:'Pendiente de revisión del CPA',reviewed:'Revisado por el CPA',changes:'Requiere corrección'} as const;
export const reserveLabels={tax:'Contribuciones',ivu:'IVU',payroll:'Nómina'} as const;
const sum=(v:number[])=>addAmounts(...v.map(cents));
export function netDeposit(p:Pick<EntryInput,'grossCents'|'commissionCents'|'refundCents'|'ivuCents'>) {
 if ([p.grossCents,p.commissionCents,p.refundCents,p.ivuCents].some(v=>v===null)) return null;
 return sum([p.grossCents!,-p.commissionCents!,-p.refundCents!,p.ivuCents!]);
}
export function commercialAmount(p:Pick<EntryInput,'kind'|'amountCents'|'useKind'|'businessBps'>):number|null {
 if(p.kind==='income'||p.useKind==='business')return p.amountCents;
 if(p.useKind==='pending')return null;
 if(p.useKind==='personal')return 0;
 return p.businessBps===null?null:cents(Number((BigInt(p.amountCents)*BigInt(p.businessBps)+5000n)/10000n));
}
/** Reparto proporcional por restos mayores: cada centavo aparece una sola vez. */
export function distribute(total:number,allocations:Allocation[]):number[] {
 cents(total);if(total<0)throw new UserInputError('No se distribuyen cantidades negativas.');
 const base=sum(allocations.map(a=>a.amountCents));if(base<=0)return [];
 const rows=allocations.map((a,i)=>{const product=BigInt(total)*BigInt(a.amountCents);return {i,value:Number(product/BigInt(base)),remainder:product%BigInt(base)};});
 let rest=total-sum(rows.map(r=>r.value));
 for(const row of [...rows].sort((a,b)=>a.remainder===b.remainder?(allocations[a.i].projectId<allocations[b.i].projectId?-1:1):a.remainder>b.remainder?-1:1)){if(!rest)break;row.value++;rest--;}
 return rows.map(r=>cents(r.value));
}
export function validateEntry(p:EntryInput,today:string) {
 if(!p.id||p.id.length>100||!p.holderId||!['income','expense'].includes(p.kind)||!validDate(p.date)||p.date>today||!p.description.trim()||p.description.length>240||cents(p.amountCents)<=0)throw new UserInputError('Revisa titular, descripción, fecha no futura e importe positivo.');
 if(!['cash','bank','debit','credit','other'].includes(p.paymentMethod)||(p.kind==='income'&&p.paymentMethod==='credit'))throw new UserInputError('Elige un método válido; una venta no se registra como recibida con crédito.');
 if(!Object.hasOwn(useLabels,p.useKind)||!Object.hasOwn(cpaLabels,p.cpaStatus)||p.justification.length>2000)throw new UserInputError('Revisa uso y estado de revisión.');
 if(p.kind==='expense') {
  if([p.grossCents,p.commissionCents,p.refundCents,p.ivuCents].some(v=>v!==null))throw new UserInputError('El desglose de venta corresponde a ingresos.');
  if(p.useKind==='mixed') {if(!Number.isInteger(p.businessBps)||p.businessBps!<=0||p.businessBps!>=10000||!p.justification.trim())throw new UserInputError('Un gasto mixto requiere porcentaje comercial entre 0 y 100, sin incluir extremos, y justificación.');}
  else if(p.businessBps!==null)throw new UserInputError('El porcentaje corresponde solo a gastos mixtos.');
 } else {
  if(p.useKind!=='business'||p.businessBps!==null)throw new UserInputError('Los cobros comerciales se registran como ingresos del titular.');
  for(const v of [p.grossCents,p.commissionCents,p.refundCents,p.ivuCents])if(v!==null&&cents(v)<0)throw new UserInputError('Los componentes conocidos del cobro no pueden ser negativos.');
  if((p.grossCents!==null&&p.commissionCents!==null&&p.refundCents!==null&&sum([p.commissionCents,p.refundCents])>p.grossCents)||(netDeposit(p)!==null&&netDeposit(p)!==p.amountCents))throw new UserInputError('El depósito neto debe ser ventas brutas menos comisiones y devoluciones, más IVU registrado.');
 }
 if(!p.allocations.length||p.allocations.length>200||new Set(p.allocations.map(a=>a.projectId)).size!==p.allocations.length||p.allocations.some(a=>!a.projectId||cents(a.amountCents)<=0)||sum(p.allocations.map(a=>a.amountCents))!==p.amountCents)throw new UserInputError('Reparte el importe completo entre proyectos del titular, sin repetir proyectos ni exceder el total.');
}
export interface BusinessTotals {receivedCents:number;expenseCents:number;commercialExpenseCents:number;pendingExpenseCents:number;grossCents:number|null;commissionCents:number|null;refundCents:number|null;ivuCents:number|null;pendingIncomeCount:number}
export function entryRows(e:BusinessEntry) {
 const commercial=commercialAmount(e);
 const shares=(total:number|null)=>total===null?e.allocations.map(()=>null):distribute(total,e.allocations);
 const business=shares(commercial),fees=shares(e.commissionCents),refunds=shares(e.refundCents),ivu=shares(e.ivuCents);
 const gross=e.kind==='income'&&netDeposit(e)!==null?e.allocations.map((a,i)=>sum([a.amountCents,fees[i]??0,refunds[i]??0,-(ivu[i]??0)])):shares(e.grossCents);
 return e.allocations.map((a,i)=>({...a,commercialCents:business[i],personalCents:business[i]===null?null:a.amountCents-business[i],grossCents:gross[i],commissionCents:fees[i],refundCents:refunds[i],ivuCents:ivu[i]}));
}
export function businessTotals(entries:BusinessEntry[],projectId?:string):BusinessTotals {
 const t:BusinessTotals={receivedCents:0,expenseCents:0,commercialExpenseCents:0,pendingExpenseCents:0,grossCents:0,commissionCents:0,refundCents:0,ivuCents:0,pendingIncomeCount:entries.filter(e=>!e.stale&&!e.deletedAt&&e.kind==='income'&&netDeposit(e)===null&&(!projectId||e.allocations.some(a=>a.projectId===projectId))).length};
 for(const e of entries.filter(e=>!e.stale&&!e.deletedAt))for(const r of entryRows(e).filter(r=>!projectId||r.projectId===projectId)) {
  if(e.kind==='income'){t.receivedCents=sum([t.receivedCents,r.amountCents]);for(const k of ['grossCents','commissionCents','refundCents','ivuCents'] as const)t[k]=t[k]===null||r[k]===null?null:sum([t[k],r[k]]);}
  else{t.expenseCents=sum([t.expenseCents,r.amountCents]);t.commercialExpenseCents=sum([t.commercialExpenseCents,r.commercialCents??0]);if(r.commercialCents===null)t.pendingExpenseCents=sum([t.pendingExpenseCents,r.amountCents]);}
 }
 return t;
}
export function businessExport(s:BusinessLedgerSnapshot,holderId:string,projectId:string|null,selectedDocumentIds:string[]) {
 const holder=s.holders.find(h=>h.id===holderId);if(!holder)throw new UserInputError('Selecciona un titular existente.');
 if(projectId&&!s.projects.some(p=>p.id===projectId&&p.holderId===holderId))throw new UserInputError('El proyecto no pertenece al titular.');
 const entries=s.entries.filter(e=>e.holderId===holderId&&(!projectId||e.allocations.some(a=>a.projectId===projectId)));
 const rows=entries.flatMap(e=>entryRows(e).filter(r=>!projectId||r.projectId===projectId).map(r=>({entryId:e.id,movementId:e.movementId,holderId:e.holderId,date:e.date,description:e.description,kind:e.kind,useKind:e.useKind,percentBps:e.businessBps,justification:e.justification,cpaStatus:e.cpaStatus,stale:e.stale,includedInTotals:!e.stale&&!e.deletedAt,deletedAt:e.deletedAt,documentIds:s.documents.filter(d=>d.movementId===e.movementId).map(d=>d.id).join('|'),...r})));
 const documents=s.documents.filter(d=>selectedDocumentIds.includes(d.id)&&entries.some(e=>e.movementId===d.movementId));
 const pending=[...(holder.prClassification==='pending'?[`${holder.id}: clasificación contributiva de Puerto Rico pendiente`]:[]),...(holder.federalClassification==='pending'?[`${holder.id}: clasificación federal pendiente`]:[]),...entries.flatMap(e=>[...(e.stale?[`${e.id}: movimiento modificado; conciliar antes de sumar`]:[]),...(e.deletedAt?[`${e.id}: movimiento eliminado; excluido de totales`]:[]),...(e.kind==='income'&&netDeposit(e)===null?[`${e.id}: desglose de ventas, comisiones, devoluciones o IVU pendiente`]:[]),...(e.useKind==='pending'?[`${e.id}: uso pendiente`]:[]),...(s.documents.some(d=>d.movementId===e.movementId&&!d.deletedAt&&d.status==='pending')?[`${e.id}: comprobante pendiente de revisión`]:[]),...(e.cpaStatus!=='reviewed'?[`${e.id}: ${cpaLabels[e.cpaStatus]}`]:[]),...(!s.documents.some(d=>d.movementId===e.movementId&&!d.deletedAt&&d.status!=='corrected')?[`${e.id}: comprobante pendiente`]:[])] )];
 const headings=['entryId','movementId','holderId','projectId','date','description','kind','useKind','amountCents','commercialCents','personalCents','grossCents','commissionCents','refundCents','ivuCents','percentBps','justification','cpaStatus','stale','includedInTotals','deletedAt','documentIds'] as const;
 const csv=[headings.map(csvCell).join(','),...rows.map(r=>headings.map(k=>csvCell(r[k])).join(','))].join('\r\n');
 return {format:'EduMoney-Negocio-CPA-v1',notice:'Importes en centavos USD. Revisión comercial; no determina deducibilidad. Las filas repartidas suman una sola vez. Con desglose completo, comisiones, devoluciones e IVU se reparten proporcionalmente al neto; el bruto de cada proyecto se reconcilia al centavo con esos componentes. Las reservas son manuales del titular y no son gastos ni saldos bancarios.',holder,projectId,projects:s.projects.filter(p=>p.holderId===holderId&&(!projectId||p.id===projectId)),dbas:s.dbas.filter(d=>d.holderId===holderId),rows,totals:businessTotals(entries,projectId??undefined),reserves:s.reserves.filter(r=>r.holderId===holderId),pending,documents,csv};
}
