import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import type { TaxSnapshot,Statement,TaxEntry,Classification } from './types';
import type { LedgerMovement } from '../money/types';
export function validYear(year:number){if(!Number.isInteger(year)||year<1900||year>9999)throw new UserInputError('Escribe un año contributivo de cuatro dígitos.');}
export function nullableAmount(n:number|null){if(n!==null&&(cents(n)<0))throw new UserInputError('El importe no puede ser negativo.');}
export const decimal=(n:number|null)=>{if(n===null)return 'Pendiente';const value=BigInt(cents(n));const absolute=value<0n?-value:value;return `${value<0n?'-':''}${absolute/100n}.${String(absolute%100n).padStart(2,'0')}`;};
export function defaultClassification(m:LedgerMovement):Classification{return ({income:'pending',expense:'expense_review',transfer:'transfer',loan:'loan',debt_payment:'debt_payment',goal_contribution:'savings'} as const)[m.kind];}
export function validateEntry(e:TaxEntry,m:LedgerMovement|undefined){
 validYear(e.year);if(!m||m.deletedAt||Number(m.date.slice(0,4))!==e.year)throw new UserInputError('El movimiento no está vigente en este año.');
 const allowed:Record<string,Classification[]>={income:['salary','other_income','pending'],expense:['expense_review','pending'],transfer:['transfer','pending'],loan:['loan','pending'],debt_payment:['debt_payment','pending'],goal_contribution:['savings','pending']};
 if(!allowed[m.kind].includes(e.classification))throw new UserInputError('La clasificación no corresponde al tipo de movimiento. Corrige el movimiento en su módulo.');
 if(!['personal','business','mixed','unknown'].includes(e.useKind)||!['pending','received','corrected','not_applicable'].includes(e.status))throw new UserInputError('Selecciona uso y estado válidos.');
 if(e.useKind==='mixed'&&(!Number.isInteger(e.businessBps)||e.businessBps!<=0||e.businessBps!>=10000||!e.notes.trim()))throw new UserInputError('El uso mixto requiere porcentaje comercial entre 0 y 100, sin extremos, y justificación.');
 if(e.useKind!=='mixed'&&e.businessBps!==null)throw new UserInputError('El porcentaje corresponde solo a uso mixto.');
 if(e.notes.length>2000)throw new UserInputError('La nota supera 2000 caracteres.');
}
const sum=(ns:number[])=>{const n=ns.reduce((a,n)=>a+BigInt(n),0n);return n>BigInt(Number.MAX_SAFE_INTEGER)?null:cents(Number(n));};
export function reconcile(s:TaxSnapshot,statement:Statement){
 const links=s.links.filter(l=>l.statementId===statement.id);const moves=links.map(l=>s.movements.find(m=>m.id===l.movementId));
 const stale=links.some((l,i)=>!moves[i]||moves[i]!.deletedAt||moves[i]!.version!==l.movementVersion);
 const income=moves.filter((m):m is LedgerMovement=>!!m&&!m.deletedAt&&m.kind==='income');
 const allIncome=income.length===links.length&&links.length>0;
 const gross=allIncome&&income.every(m=>m.grossCents!==null)?sum(income.map(m=>m.grossCents!)):null;
 const withheld=allIncome&&income.every(m=>m.withholdingCents!==null)?sum(income.map(m=>m.withholdingCents!)):null;
 const net=allIncome?sum(income.map(m=>m.amountCents)):null;
 const difference=(a:number|null,b:number|null)=>{if(a===null||b===null)return null;const n=BigInt(a)-BigInt(b);return n>BigInt(Number.MAX_SAFE_INTEGER)||n< -BigInt(Number.MAX_SAFE_INTEGER)?null:cents(Number(n));};
 return {stale,count:links.length,gross,withheld,net,grossDifference:difference(statement.grossCents,gross),withheldDifference:difference(statement.withheldCents,withheld),netDifference:difference(statement.netCents,net),documentChanged:!!statement.documentId&&s.documents.find(d=>d.id===statement.documentId)?.version!==statement.documentVersion};
}
export function pendingItems(s:TaxSnapshot){
 const result:string[]=[];if(!s.profile)result.push('Perfil contributivo opcional sin completar.');else if(s.profile.residence==='unknown'||s.profile.filingStatus==='unknown')result.push('Datos del perfil pendientes de confirmar.');
 for(const m of s.movements.filter(m=>!m.deletedAt&&(m.taxReview||s.entries.some(e=>e.movementId===m.id)))){
 const e=s.entries.find(e=>e.movementId===m.id);
 if(!e||e.status==='pending'||e.classification==='pending'||e.useKind==='unknown'||e.sourceVersion!==m.version)result.push(`Revisar movimiento ${m.id}: clasificación, uso, estado o versión pendiente.`);
 if(m.kind==='income'&&(m.grossCents===null||m.withholdingCents===null))result.push(`Ingreso ${m.id}: bruto o retención sin confirmar; depósito neto no equivale a bruto.`);
 }
 for(const e of s.entries.filter(e=>e.documentId)){const d=s.documents.find(d=>d.id===e.documentId);if(!d||e.status==='pending'||d.status==='pending'||d.status==='corrected'||d.version!==e.sourceVersion)result.push(`Revisar documento ${e.documentId}.`);}
 for(const a of s.statements){if(a.status==='corrected'||a.status==='not_applicable')continue;const r=reconcile(s,a);if(!a.documentId||a.status==='pending'||a.grossCents===null||a.withheldCents===null||r.count===0||r.stale||r.documentChanged||r.grossDifference!==0||r.withheldDifference!==0||a.netCents!==null&&r.netDifference!==0)result.push(`Informativa ${a.id}: datos, documentos o conciliación pendientes.`);}
 for(let i=0;i<s.statements.length;i++)for(let j=i+1;j<s.statements.length;j++){const a=s.statements[i],b=s.statements[j];if(a.status!=='corrected'&&b.status!=='corrected'&&a.status!=='not_applicable'&&b.status!=='not_applicable'&&a.payer.trim().toLocaleLowerCase()===b.payer.trim().toLocaleLowerCase()&&a.formType===b.formType&&a.grossCents!==null&&a.grossCents===b.grossCents)result.push(`Posible duplicado: informativas ${a.id} y ${b.id}; confirmar, no se suman.`);}
 for(const m of s.movements){const active=s.links.filter(l=>l.movementId===m.id&&s.statements.some(a=>a.id===l.statementId&&!['corrected','not_applicable'].includes(a.status)));if(active.length>1)result.push(`Movimiento ${m.id} vinculado a varias informativas: posible duplicado.`);}
 return result;
}
/** Evita fórmulas de hojas de cálculo sin alterar los datos del archivo JSON. */
export function csvCell(value:unknown){const text=value===null||value===undefined?'':String(value);return '"'+(/^[\s]*[=+@-]/.test(text)?"'"+text:text).replace(/"/g,'""')+'"';}
export function buildExport(s:TaxSnapshot,includeProfile:boolean,selectedDocumentIds:string[]){
 const ids=new Set(s.entries.map(e=>e.movementId).filter(Boolean));for(const l of s.links)ids.add(l.movementId);
 const movements=s.movements.filter(m=>!m.deletedAt&&(m.taxReview||ids.has(m.id)));
 const rows=[['id','fecha','tipo','descripcion','deposito_o_importe_centavos','bruto_centavos','retencion_centavos','uso','clasificacion','estado','documentos'] as unknown[],...movements.map(m=>{const e=s.entries.find(e=>e.movementId===m.id);return [m.id,m.date,m.kind,m.description,m.amountCents,m.grossCents,m.withholdingCents,e?.useKind??m.useKind,e?.classification??defaultClassification(m),e?.status??'pending',s.documents.filter(d=>d.movementId===m.id).map(d=>d.id).join(';')];})];
 return {format:'EduMoney-CPA-v1',year:s.year,notice:'Expediente para revisión profesional. No determina deducibilidad ni prepara o radica una planilla. Informativas y movimientos no se suman entre sí.',profile:includeProfile?s.profile:null,movements,entries:s.entries,statements:s.statements,links:s.links,reconciliation:s.statements.map(a=>({id:a.id,...reconcile(s,a)})),pending:pendingItems(s),documents:s.documents.filter(d=>selectedDocumentIds.includes(d.id)),csv:rows.map(r=>r.map(csvCell).join(',')).join('\r\n')};
}
