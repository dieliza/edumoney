import { UserInputError } from '../../../core/errors';
import { cents } from '../../../core/money';
import { validDate } from '../../money/domain';
import type { Kind,Models } from './types';
const fail=(message:string):never=>{throw new UserInputError(message);};
const text=(v:unknown,max=2000,required=false)=>typeof v==='string'&&v.length<=max&&(!required||!!v.trim());
const year=(v:unknown)=>typeof v==='number'&&Number.isInteger(v)&&v>=1900&&v<=9998;
const amount=(v:number|null,signed=false)=>{if(v!==null&&(cents(v)<0&&!signed))fail('Revisa los importes no negativos; deja en blanco los desconocidos.');};
const answer=(v:unknown)=>['yes','no','pending'].includes(String(v));
export function validate<K extends Kind>(kind:K,value:Models[K],today:string){
 const v=value as unknown as Record<string,unknown>;
 if(!text(v.id,100,true)||!text(v.holderId,100,true))fail('Identificador o titular no válido.');
 if('year' in v&&!year(v.year))fail('Año de cuatro dígitos entre 1900 y 9998.');
 if('date' in v&&v.date!==null&&(!validDate(v.date as string)||(kind!=='calendar'&&(v.date as string)>today)))fail('Fecha no válida o futura para un registro real.');
 if(kind==='plan'){
  const p=value as Models['plan'];
  if(!validDate(p.openingDate)||!p.openingDate.startsWith(String(p.year))||p.openingDate>today)fail('La fecha de efectivo inicial debe pertenecer al año del panel.');
  for(const a of [p.cashComplete,p.defaultOperating,p.paymentsComplete,p.ivu,p.contractors,p.employees,p.calendarYear])if(!answer(a))fail('Estado de confirmación no válido.');
  if(!['pr','federal','combined'].includes(p.taxScope)||!['individual','corporation','manual','pending'].includes(p.estimatedSchedule)||!text(p.taxBasis)||!text(p.notes))fail('Revisa alcance, calendario y fundamento del panel.');
  amount(p.openingCashCents,true);for(const n of [p.annualTaxCents,p.creditsCents,p.taxReserveAllocatedCents])amount(n);
 }
 if(kind==='treatment'){
  const t=value as Models['treatment'];if(!text(t.entryId,100,true)||!Number.isInteger(t.entryVersion)||t.entryVersion<1||!['operating','equipment','tax','financing','owner','pending'].includes(t.role)||!text(t.note,2000,true))fail('Revisa movimiento, clasificación y motivo.');
 }
 if(kind==='cash'){
  const c=value as Models['cash'];amount(c.amountCents);if(c.amountCents===null||c.amountCents<=0||!['in','out'].includes(c.direction)||!['capital','loan','repayment','card_payment','equipment','other'].includes(c.kind)||!text(c.reference,240,true)||!text(c.note,2000,true)||(!!c.movementId)!==(c.movementVersion!==null))fail('Revisa entrada/salida de efectivo, referencia única y nota.');
 }
 if(kind==='payment'){
  const p=value as Models['payment'];amount(p.amountCents);
  if(!['pr','federal'].includes(p.jurisdiction)||!['paid','pending'].includes(p.status)||!['linked','separate','pending'].includes(p.cash)||!text(p.reference,240)||!text(p.note,2000,true))fail('Revisa jurisdicción, pago estimado y confirmación.');
  if(p.status==='paid'&&(p.amountCents===null||p.amountCents<=0||!p.reference.trim()))fail('Un pago realizado necesita importe positivo y referencia.');
  if((p.cash==='linked')!==!!p.entryId||(p.cash==='linked')!==(p.entryVersion!==null))fail('Selecciona el gasto vinculado o el tratamiento de efectivo correspondiente.');
 }
 if(kind==='scenario'){
  const s=value as Models['scenario'];if(!text(s.name,200,true)||!text(s.assumptions,2000,true))fail('Nombra el escenario y explica sus supuestos.');
  for(const n of [s.salesCents,s.expensesCents,s.collectionsCents,s.paymentsCents,s.taxChangeCents])amount(n,true);
  amount(s.equipmentCostCents);amount(s.equipmentCashCents);
  if(s.equipmentCostCents!==null&&s.equipmentCashCents!==null&&s.equipmentCashCents>s.equipmentCostCents)fail('El pago de equipo no puede exceder su costo en este escenario.');
 }
 if(kind==='calendar'){
  const c=value as Models['calendar'];if(!text(c.name,200,true)||!text(c.source,2000,c.date!==null)||!text(c.note,2000,true)||!['pending','done'].includes(c.status)||!text(c.reference,240))fail('Revisa obligación, fuente y nota del calendario.');
  if(c.completedDate!==null&&(!validDate(c.completedDate)||c.completedDate>today))fail('Fecha de atención no válida.');
  if(c.status==='done'&&(!c.completedDate||!c.reference.trim()))fail('Una obligación atendida necesita fecha y referencia propia; no registra un pago.');
 }
}
