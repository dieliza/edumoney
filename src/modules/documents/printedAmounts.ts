import {parseAmount} from '../../core/money';
/** Reconoce separadores impresos sin inventar un decimal ausente. Solo corrige letras dentro de un token monetario. */
export function printedAmounts(text:string){
 const result:{amount:string;index:number;length:number;corrected:boolean}[]=[];
 const pattern=/(?:^|[\s$:(])([0-9OIlS]+(?:(?:[.,]\s*|\s+)[0-9OIlS]{3})*\s*[.,]\s*[0-9OIlS]{2})(?=$|[\s$);]|USD\b)/g;
 for(const match of text.matchAll(pattern)){
  const raw=match[1];if(!/\d/.test(raw))continue;
  const numeric=raw.replace(/[OIlS]/g,c=>({O:'0',I:'1',l:'1',S:'5'})[c]!).trim();const split=Math.max(numeric.lastIndexOf('.'),numeric.lastIndexOf(','));
  const whole=numeric.slice(0,split).trim(),fraction=numeric.slice(split+1).replace(/\s/g,'');
  if(!/^\d+$/.test(whole)&&!/^\d{1,3}(?:[.,\s]+\d{3})+$/.test(whole))continue;
  const amount=`${whole.replace(/[.,\s]/g,'')}.${fraction}`;try{parseAmount(amount);}catch{continue;}
  const index=match.index!+match[0].indexOf(raw);result.push({amount,index,length:raw.length,corrected:/[OIlS]/.test(raw)});
 }
 return result;
}
