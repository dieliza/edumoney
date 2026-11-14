import {UserInputError} from '../../../core/errors';
import {formatMoney} from '../../money/domain';
import type {AnthropicReading,ReadingDetails} from './types';
export const detailMoneyLabels={subtotal_cents:'Subtotal',discount_cents:'Descuentos',tip_cents:'Propina',service_cents:'Cargo por servicio',shipping_cents:'Envío',tendered_cents:'Importe entregado',change_cents:'Cambio',printed_deductions_cents:'Deducciones totales impresas',gross_ytd_cents:'Bruto acumulado YTD',net_ytd_cents:'Neto acumulado YTD'} as const;
export function validateReading(r:AnthropicReading){
 const fail=()=>{throw new UserInputError('Revisa el desglose reconocido del comprobante.');};
 if(!r||!['receipt','check','paystub'].includes(r.document_type)||r.currency!=='USD'||JSON.stringify(r).length>64000)fail();
 const money=(v:unknown)=>{if(v!==null&&(!Number.isSafeInteger(v)||Number(v)<0||Number(v)>10000000000))fail();};
 const text=(v:unknown,max=240)=>{if(v!==null&&(typeof v!=='string'||v.length>max))fail();};
 for(const v of [r.total_paid_cents,r.gross_cents,r.net_cents])money(v);text(r.merchant);for(const v of [r.date,r.period_start,r.period_end])text(v,10);
 if(!Array.isArray(r.deductions)||r.deductions.length>100||!Array.isArray(r.earnings)||r.earnings.length>100||!Array.isArray(r.warnings)||r.warnings.length>30)fail();
 for(const d of r.deductions){text(d.label);text(d.category);money(d.amount_cents);}for(const e of r.earnings){text(e.code,60);text(e.hours,30);money(e.rate_cents);money(e.amount_cents);}for(const w of r.warnings)text(w,500);
 const d=r.details;if(!d)return;
 for(const key of Object.keys(detailMoneyLabels) as (keyof typeof detailMoneyLabels)[])money(d[key]);
 text(d.address);text(d.municipality,100);text(d.reference,100);text(d.due_date,10);if(d.payment_method!==null&&!['cash','check','debit','credit','bank','other'].includes(d.payment_method))fail();
 if(!Array.isArray(d.taxes)||d.taxes.length>30||!Array.isArray(d.items)||d.items.length>100||!Array.isArray(d.employer_contributions)||d.employer_contributions.length>30)fail();
 for(const t of d.taxes){text(t.label,160);money(t.amount_cents);if(!['sales','withholding','other'].includes(t.kind)||t.rate_percent!==null&&(!/^\d{1,3}(?:\.\d{1,6})?$/.test(t.rate_percent)||Number(t.rate_percent)>100))fail();}
 for(const i of d.items){text(i.description);text(i.quantity,30);if(i.quantity!==null&&!/^\d{1,12}(?:\.\d{1,6})?$/.test(i.quantity))fail();money(i.unit_cents);money(i.amount_cents);}for(const e of d.employer_contributions){text(e.label,160);money(e.amount_cents);}
}
export function readingSummary(r:AnthropicReading):string{
 const value=(n:number|null)=>n===null?'Por confirmar':formatMoney(n);
 const d=r.details;return [r.merchant?`Comercio / pagador: ${r.merchant}`:'',r.date?`Fecha impresa: ${r.date}`:'',r.document_type==='receipt'?`Total del recibo: ${value(r.total_paid_cents)}`:`Bruto actual: ${value(r.gross_cents)} · Neto actual: ${value(r.net_cents)}`,...(d?[
 d.address?`Dirección comercial: ${d.address}`:'',d.municipality?`Municipio: ${d.municipality}`:'',d.reference?`Referencia: ${d.reference}`:'',d.due_date?`Vencimiento impreso: ${d.due_date}`:'',d.payment_method?`Método impreso: ${d.payment_method}`:'',
 ...Object.entries(detailMoneyLabels).filter(([k])=>d[k as keyof typeof detailMoneyLabels]!==null).map(([k,label])=>`${label}: ${value(d[k as keyof typeof detailMoneyLabels])}`),
 ...d.taxes.map(t=>`${t.label} (${t.kind==='sales'?'impuesto sobre ventas':t.kind==='withholding'?'retención':'tipo pendiente'})${t.rate_percent!==null?` · ${t.rate_percent}%`:''}: ${value(t.amount_cents)}`),
 ...d.items.map(i=>`${i.description} · Cantidad ${i.quantity??'pendiente'} · Unitario ${value(i.unit_cents)} · Importe ${value(i.amount_cents)}`),
 ...d.employer_contributions.map(e=>`Aportación patronal · ${e.label}: ${value(e.amount_cents)}`)]:[]),...r.warnings.map(w=>`Revisar: ${w}`)].filter(Boolean).join('\n');
}
/** Copia revisada del dato principal; los desgloses siguen siendo evidencia, no reglas fiscales. */
export function reviewedReading(r:AnthropicReading,merchant:string,date:string|null,amount:number|null,details=r.details):AnthropicReading{
 const result={...r,merchant:merchant.trim()||null,date,...(r.document_type==='receipt'?{total_paid_cents:amount}:{net_cents:amount}),...(details?{details}: {})};validateReading(result);return result;
}
export const blankReadingDetails=():ReadingDetails=>({address:null,municipality:null,reference:null,due_date:null,payment_method:null,subtotal_cents:null,discount_cents:null,tip_cents:null,service_cents:null,shipping_cents:null,tendered_cents:null,change_cents:null,printed_deductions_cents:null,gross_ytd_cents:null,net_ytd_cents:null,taxes:[],items:[],employer_contributions:[]});
