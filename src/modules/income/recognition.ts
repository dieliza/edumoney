import {printedAmounts} from '../documents/printedAmounts';
import {parseAmount} from '../../core/money';
import {proposeFields} from '../documents/domain';
export type RecognizedDeduction={categoryId:string;label:string;amount:string};
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
export function recognizeIncome(text:string,check=false){
 const lines=text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);const warnings=new Set<string>();
 let columnOrder:'first'|'last'|'unknown'='unknown';
 let inDeductions=false;
 let accumulated=false;const gross:string[]=[],net:string[]=[];const deductions:RecognizedDeduction[]=[];
 for(const original of lines){const line=normalize(original);
  const currentAt=line.search(/CURRENT|ACTUAL|PERIODO/),ytdAt=line.search(/YTD|YEAR TO DATE|ACUMULAD/);
  if(currentAt>=0&&ytdAt>=0){columnOrder=currentAt<ytdAt?'first':'last';accumulated=false;}
  if(/\bSSN\b|SOCIAL SECURITY NUMBER|NUMERO DE SEGURO SOCIAL|\bEIN\b|ACCOUNT NUMBER|NUMERO DE CUENTA/.test(line))continue;
  if(/^(DEDUCTIONS|DEDUCCIONES|DESCUENTOS)(\s|:|$)/.test(line))inDeductions=true;
  if(/^(EARNINGS|INGRESOS|DEVENGADO)(\s|:|$)/.test(line))inDeductions=false;
  if(/^(YEAR TO DATE|YTD|ACUMULADOS?)(\s|:|$)/.test(line)&&!/(CURRENT|ACTUAL|PERIODO)/.test(line)){accumulated=true;warnings.add('Se omitió una sección de acumulados del año.');continue;}
  if(/^(CURRENT|DEDUCCIONES DEL PERIODO|DEDUCCIONES ACTUALES)/.test(line))accumulated=false;
  if(accumulated||(/\bYTD\b|ACUMULADO/.test(line)&&!/(CURRENT|ACTUAL|PERIODO)/.test(line)))continue;
  if(/PATRONAL|PATRONO|EMPLOYER|\bER\b|FUTA|SUTA|CFSE/.test(line)){warnings.add('Aportaciones patronales no se restaron del pago del empleado.');continue;}
  const detected=printedAmounts(original).filter(m=>!/^\s*%/.test(original.slice(m.index+m.length)));
  if(detected.some(m=>m.corrected))warnings.add('Se corrigieron letras confundidas con cifras. Verifica importes y decimales contra la foto.');
  const values=detected.map(m=>m.amount);
  let amount=values.length===1&&columnOrder==='unknown'?values[0]:values.length===2&&columnOrder!=='unknown'?(columnOrder==='first'?values[0]:values[1]):'';
  if(values.length>0&&!amount)warnings.add('Hay columnas de cifras incompletas o ambiguas: confirma los importes del pago actual, no los acumulados.');
  if(amount){try{parseAmount(amount);}catch{amount='';}}
  if(/TOTAL.*DEDUC|TOTAL.*WITHHOLD|TOTAL.*DESCUENT|TOTAL TAXES/.test(line))continue;
  if(/GROSS\s*(PAY|WAGES|EARNINGS)?|SALARIO BRUTO|INGRESO[S]? BRUTO|TOTAL INGRESOS/.test(line)){if(amount)gross.push(amount);continue;}
  if(/NET\s*(PAY|WAGES)|PAGO NETO|NETO A PAGAR|DEPOSITO NETO|SALARIO NETO/.test(line)||(check&&/\bAMOUNT\b|IMPORTE DEL CHEQUE|CANTIDAD DEL CHEQUE/.test(line))){if(amount)net.push(amount);continue;}
  let categoryId='';
  if(/ADDITIONAL MEDICARE|MEDICARE ADICIONAL/.test(line))categoryId='additional-medicare';
  else if(/MEDICARE|\bFICA MED\b/.test(line))categoryId='medicare';
  else if(/SOCIAL SECURITY|SEGURO SOCIAL|OASDI|\bFICA SS\b|\bSS TAX\b/.test(line))categoryId='social-security';
  else if(/PUERTO RICO.*(TAX|CONTRIB|RETEN)|\bPR\b.*(TAX|INCOME|RETEN)|CONTRIB.*PUERTO RICO/.test(line))categoryId='pr-tax';
  else if(/FEDERAL.*(TAX|WITHHOLD)|\bFIT\b/.test(line))categoryId='federal-tax';
  else if(/SINOT|DISABILITY.*PR/.test(line))categoryId='sinot';
  else if(/401\s*\(?K\)?|RETIRO|RETIREMENT|PENSION PLAN/.test(line))categoryId='retirement';
  else if(/DENTAL/.test(line))categoryId='dental';
  else if(/MEDICAL|HEALTH|PLAN MEDICO/.test(line))categoryId='medical';
  else if(/LIFE INSURANCE|SEGURO DE VIDA/.test(line))categoryId='life';
  else if(/ASUME|CHILD SUPPORT|ALIMENTARIA/.test(line))categoryId='asume';
  else if(/UNION DUES|CUOTA.*UNION/.test(line))categoryId='union';
  else if(/LOAN.*(PAY|DEDUC)|PRESTAMO/.test(line))categoryId='loan';
  else if(/\bTAX\b|CONTRIB|RETENCION|WITHHOLD|\bFICA\b/.test(line)){categoryId='other';warnings.add('Una retención no identifica claramente su jurisdicción o desglose. Confirma su categoría.');}
  if(!categoryId&&inDeductions&&values.length)categoryId='other';
  if(categoryId)deductions.push({categoryId,label:original.replace(/\b\d{3}[- ]\d{2}[- ]\d{4}\b/g,'[dato sensible omitido]').slice(0,240),amount});
 }
 const unique=(values:string[])=>{const distinct=[...new Set(values)];if(distinct.length>1)warnings.add('Hay importes contradictorios. Confirma la cifra del período actual.');return distinct.length===1?distinct[0]:'';};
 const base=proposeFields(text);
 return {gross:unique(gross),net:unique(net),date:base.date,issuer:lines.find(l=>/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(l)&&!/(SSN|EIN|SOCIAL SECURITY|ACCOUNT|CUENTA|\d{3}[- ]\d{2}[- ]\d{4})/i.test(l))?.slice(0,240)??'',deductions,warnings:[...warnings,'Revisa todas las deducciones: el reconocimiento no garantiza detectar cada línea. Un cheque por sí solo no demuestra bruto ni deducciones.']};
}
