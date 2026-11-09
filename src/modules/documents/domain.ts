import { UserInputError } from '../../core/errors';
import { parseAmount } from '../../core/money';
import { validDate } from '../money/domain';
import type { ImageData } from './types';
export const MAX_IMAGE_BYTES=4*1024*1024;
export function validateImage(image:ImageData){
 if(!['image/jpeg','image/png'].includes(image.mime)||!image.base64||image.base64.length>Math.ceil(MAX_IMAGE_BYTES/3)*4||(image.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(image.base64)))throw new UserInputError('Usa una imagen JPEG o PNG de hasta 4 MB.');
 const bytes=image.base64.length/4*3-(image.base64.endsWith('==')?2:image.base64.endsWith('=')?1:0);if(bytes>MAX_IMAGE_BYTES)throw new UserInputError('La imagen supera 4 MB.');
 if(image.mime==='image/jpeg'&&!image.base64.startsWith('/9j/')||image.mime==='image/png'&&!image.base64.startsWith('iVBORw0KGgo'))throw new UserInputError('La imagen no corresponde al formato declarado.');
}
/** Propuestas conservadoras: nunca confirma fecha, pago, categoría ni importe por sí solo. */
export function proposeFields(text:string):{description:string;date:string;amount:string;warnings:string[]}{
 const lines=text.split(/\n/).map(l=>l.trim()).filter(Boolean);const warnings=['Revisa los datos: reconocimiento no significa que estén correctos ni pagados.'];
 const description=lines.find(l=>!/^\d|total|subtotal|fecha|date|tax|ivu|cash|cambio/i.test(l))?.slice(0,100)??'';
 const dates=[...text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)].map(m=>m[0]).filter(validDate);
 let date=dates.length===1?dates[0]:'';
 const local=[...text.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g)];
 if(!date&&local.length===1){const [,a,b,y]=local[0];if(Number(a)>12&&Number(b)<=12)date=`${y}-${b.padStart(2,'0')}-${a.padStart(2,'0')}`;else if(Number(b)>12&&Number(a)<=12)date=`${y}-${a.padStart(2,'0')}-${b.padStart(2,'0')}`;if(date&&!validDate(date))date='';}
 if(!date)warnings.push('La fecha falta o es ambigua. Confírmala manualmente en AAAA-MM-DD.');
 const totals=lines.filter(l=>/^(?:total|importe total|amount due|balance due)\b/i.test(l)&&!/^subtotal/i.test(l)).flatMap(l=>[...l.matchAll(/(?:\$\s*)?(\d+(?:,\d{3})*\.\d{2})\b/g)].map(m=>m[1].replaceAll(',','')));
 const unique=[...new Set(totals)];let amount=unique.length===1?unique[0]:'';
 if(amount){try{if(parseAmount(amount)<=0)amount='';}catch{amount='';}}
 if(!amount)warnings.push('No hay un total único y claro. No se suman partidas ni se supone una cantidad.');
 return {description,date,amount,warnings};
}
export function proposeVoice(text:string){
 const base=proposeFields(text);const amounts=[...text.matchAll(/(?:\$\s*|\b)(\d+(?:\.\d{1,2})?)\s*(?:d[oó]lares|usd)\b/gi)];
 if(!base.amount&&amounts.length===1){try{if(parseAmount(amounts[0][1])>0)base.amount=amounts[0][1];}catch{}}
 return {...base,description:text.replace(/\s+/g,' ').trim().slice(0,100),warnings:['Revisa el dictado antes de guardar. Las palabras y cifras pueden estar equivocadas.',...base.warnings.slice(1)]};
}
