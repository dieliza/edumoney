import type {ReceiptFragment} from './receiptImage';
import {printedAmounts} from './printedAmounts';
export type PhotoRow={text:string;y:number;height:number;confidence?:number;fragments?:ReceiptFragment[];verifiedZero?:boolean};
export type PhotoReading={rows:PhotoRow[];confidence:number;fallback?:boolean};
export const financialRow=(text:string)=>/\b(?:TOTAL|SUBTOTAL|GROSS|NET|BRUTO|NETO|AMOUNT|IMPORTE|DEDUC\w*|DESCUENT\w*|SOCIAL|MEDICARE|OASDI|FICA|TAX|IVU|SINOT|RETIRO|RETIREMENT|MEDICO|MED|INCP|REGHR|OVRHR|VAC|SICK|OTHR|HOLD|HEALTH|DENTAL|ASUME|LOAN|UNION|WITHHOLD\w*)\b/i.test(text);
const values=(text:string)=>printedAmounts(text).filter(m=>!/^\s*%/.test(text.slice(m.index+m.length))).map(m=>m.amount);
const subset=(small:string[],large:string[])=>{let at=0;for(const n of large)if(small[at]===n)at++;return at===small.length;};
const score=(row:PhotoRow)=>values(row.text).length*1000+row.text.trim().split(/\s+/).length*10+(row.confidence??0);
export function reconcilePhotoReadings(readings:readonly PhotoReading[]){
 type Candidate=PhotoRow&{fallback:boolean};const groups:{y:number;height:number;rows:Candidate[]}[]=[];
 for(const reading of readings)for(const row of reading.rows){if(!row.text.trim())continue;const candidate={...row,fallback:!!reading.fallback},group=groups.find(g=>Math.abs(g.y-row.y)<Math.min(g.height,row.height)*.45);if(group)group.rows.push(candidate);else groups.push({y:row.y,height:row.height,rows:[candidate]});}
 let conflict=false;
 const text=groups.sort((a,b)=>a.y-b.y).map(g=>{
  const primary=g.rows.filter(r=>!r.fallback&&values(r.text).length);
  const checked=primary.length?primary:g.rows.filter(r=>values(r.text).length);
  const sequences=checked.map(r=>values(r.text)),longest=[...sequences].sort((a,b)=>b.length-a.length)[0]??[];
  const compatible=sequences.every(s=>subset(s,longest));
  // El contraste y las ampliaciones completan huecos; una lectura auxiliar ruidosa no borra cifras primarias compatibles.
  const candidates=primary.length?g.rows.filter(r=>!r.fallback||subset(longest,values(r.text))):g.rows;
  const best=[...candidates].sort((a,b)=>score(b)-score(a))[0];
  const withZero=(text:string)=>g.rows.some(r=>r.verifiedZero)?(/MED\.?\s*INS/i.test(text)?text.replace(/MED\.?\s*INS.*$/i,'MED. INS 0'):`${text} MED. INS 0`):text;
  if(!compatible){conflict=true;let safe=best.text;for(const m of printedAmounts(best.text).reverse())safe=safe.slice(0,m.index)+' [importe por confirmar] '+safe.slice(m.index+m.length);return withZero(safe);}
  const label=g.rows.find(r=>financialRow(r.text));return withZero(label&&!financialRow(best.text)?`${label.text}  ${best.text}`:best.text);
 }).join('\n');
 return {text,needsAmountReview:conflict,confidence:Math.max(0,...readings.map(r=>r.confidence))};
}
