import {printedAmounts} from '../documents/printedAmounts';
import {validDate} from '../money/domain';
export type RecognizedEarning={code:string;rate:string;hours:string;amount:string};
export function paystubTable(text:string){
 const earnings:RecognizedEarning[]=[];const output:string[]=[];let table=false;
 for(const source of text.split(/\r?\n/)){
  let line=source.replace(/[|\[\]{}]/g,' ').replace(/\s+/g,' ').trim();
  if(/CODE.*RATE.*HOURS.*AMOUNT/i.test(line))table=true;
  if(/WAGE AMOUNTS|GROSS WAGES|NET WAGES|^PAYMENT$/i.test(line))table=false;
  const known=line.search(/\b(?:REGHR|OVRHR|VAC|SICK|OTHR|HOLD|REGULAR|OVERTIME|BONUS)\b/i);if(known>0&&printedAmounts(line).length>=2)line=line.slice(known);
  const code=/^(REGHR|OVRHR|VAC|SICK|OTHR|HOLD|REGULAR|OVERTIME|BONUS)\b/i.exec(line);
  const tax=/(?:^|\s)(FICA|INCP\.?|[I1Ll]\.?\s*T\.?|MED\.?\s*INS)\b/i.exec(line);
  let left=line,right='';if(tax&&tax.index>0&&(code||printedAmounts(line.slice(0,tax.index)).length>=2)){left=line.slice(0,tax.index).trim();right=line.slice(tax.index).trim();}
  if(right&&!code){output.push(right);continue;}
  if(code&&(table||printedAmounts(left).length>=3)){
   const values=printedAmounts(left);earnings.push({code:code[1],rate:values.length===3?values[0].amount:'',hours:values.length===3?values[1].amount:'',amount:values.length===3?values[2].amount:''});
   if(right)output.push(right);continue;
  }
  // Las dos mitades de un renglón de salarios son conceptos separados, no columnas actual/acumulado.
  const net=line.search(/\bNET\s+(?:WAGES|PAY)\b/i);if(net>0&&/GROSS/i.test(line))output.push(line.slice(0,net).trim(),line.slice(net));else output.push(line);
 }
 const lines=output.filter(Boolean);let date='',periodStart='',periodEnd='';
 const header=lines.findIndex(l=>/PAY DATE.*START PERIOD.*END PERIOD/i.test(l));
 if(header>=0){const candidates=lines.slice(header+1,header+3).flatMap(l=>[...l.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)]);if(candidates.length===3){const us=candidates.some(m=>Number(m[2])>12),international=candidates.some(m=>Number(m[1])>12);if(us!==international){const dates=candidates.map(m=>`${m[3]}-${(us?m[1]:m[2]).padStart(2,'0')}-${(us?m[2]:m[1]).padStart(2,'0')}`);if(dates.every(validDate))[date,periodStart,periodEnd]=dates;}}}
 return {lines,earnings,date,periodStart,periodEnd};
}
