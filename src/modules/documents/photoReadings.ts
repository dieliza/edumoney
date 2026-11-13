import {printedAmounts} from './printedAmounts';
export type PhotoRow={text:string;y:number;height:number;confidence?:number};
export type PhotoReading={rows:PhotoRow[];confidence:number};
export const financialRow=(text:string)=>/\b(?:TOTAL|SUBTOTAL|GROSS|NET|BRUTO|NETO|AMOUNT|IMPORTE|DEDUC\w*|DESCUENT\w*|SOCIAL|MEDICARE|OASDI|FICA|TAX|IVU|SINOT|RETIRO|RETIREMENT|MEDICO|HEALTH|DENTAL|ASUME|LOAN|UNION|WITHHOLD\w*)\b/i.test(text);
const signature=(text:string)=>printedAmounts(text).filter(m=>!/^\s*%/.test(text.slice(m.index+m.length))).map(m=>m.amount).join('|');
export function reconcilePhotoReadings(readings:readonly PhotoReading[]){
 const groups:{y:number;height:number;rows:PhotoRow[]}[]=[];
 for(const reading of readings)for(const row of reading.rows){if(!row.text.trim())continue;const group=groups.find(g=>Math.abs(g.y-row.y)<Math.min(g.height,row.height)*.45);if(group)group.rows.push(row);else groups.push({y:row.y,height:row.height,rows:[row]});}
 let conflict=false;
 const text=groups.sort((a,b)=>a.y-b.y).map(g=>{
  const best=[...g.rows].sort((a,b)=>(Number(!!signature(b.text))*100+(b.confidence??0))-(Number(!!signature(a.text))*100+(a.confidence??0)))[0];
  const values=new Set(g.rows.map(r=>signature(r.text)).filter(Boolean));
  if(values.size>1){conflict=true;let safe=best.text;for(const m of printedAmounts(best.text).reverse())safe=safe.slice(0,m.index)+' [importe por confirmar] '+safe.slice(m.index+m.length);return safe;}
  const label=g.rows.find(r=>financialRow(r.text));
  return label&&!financialRow(best.text)?`${label.text}  ${best.text}`:best.text;
 }).join('\n');
 return {text,needsAmountReview:conflict,confidence:Math.max(0,...readings.map(r=>r.confidence))};
}
