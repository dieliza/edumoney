import {recognizedPayment} from './paymentRecognition';
import {isVoicePlaceholder} from '../money/categoryLabels';
import {parseAmount,type Cents} from '../../core/money';
import {validDate} from '../money/domain';
import type {Category,PaymentMethod} from '../money/types';
const normal=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const units:Record<string,number>={cero:0,un:1,uno:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiun:21,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,cuarenta:40,cincuenta:50,sesenta:60,setenta:70,ochenta:80,noventa:90,cien:100,ciento:100,doscientos:200,trescientos:300,cuatrocientos:400,quinientos:500,seiscientos:600,setecientos:700,ochocientos:800,novecientos:900};
function spokenInteger(s:string):number|null{if(/^\d+$/.test(s))return Number.isSafeInteger(Number(s))?Number(s):null;const words=s.trim().split(/\s+/);let total=0,prior=1000;for(let i=0;i<words.length;i++){if(words[i]==='y'){if(i===0||i===words.length-1||words[i-1]==='y')return null;continue;}const n=units[words[i]];if(n===undefined||n>=prior)return null;total+=n;prior=n;}return total;}
const numberWords=Object.keys(units).join('|');
const numeric='(?:\\d{1,3}(?:,\\d{3})+(?:\\.\\d{1,2})?|\\d+(?:[.,]\\d{1,2})?)';
const spoken=`(?:${numberWords})(?:\\s+(?:${numberWords}|y))*`;
function decimal(s:string){return s.includes('.')?s.replaceAll(',',''):s.replace(',','.');}
export interface VoiceEntryProposal {kind:'income'|'expense'|null;amountCents:Cents|null;date:string;category:Category|null;method:PaymentMethod|null;ready:boolean;needsPayment:boolean;reasons:string[]}
export function classifyVoiceEntry(text:string,categories:Category[],today:string,confirmedMethod?:PaymentMethod):VoiceEntryProposal{
 if(text.length>1000)return {kind:null,amountCents:null,date:today,category:null,method:null,ready:false,needsPayment:false,reasons:['Dictado extenso: se conservará como nota para revisión.']};
 const s=normal(text),reasons:string[]=[];
 const income=/\b(cobre|recibi|ingreso|ingrese|gane|me pagaron|salario recibido)\b/.test(s);
 const expense=/\b(gaste|pague|compre|gasto|compra)\b/.test(s);
 const blocked=/(?:^|[\s$])-\s*\d/.test(s)||/\b(no|nunca|quizas|tal vez|voy a|pagare|gastare|recibire|cobrar|pendiente|debo|deuda|prestamo|transferencia|transferi|tarjeta de credito)\b/.test(s.replace(/\btransferencia bancaria\b/g,'pago bancario'));
 const kind=income!==expense&&!blocked?(income?'income':'expense'):null;
 if(!kind)reasons.push('Tipo de operación ambiguo o no realizado.');
 let date=today;
 const iso=[...s.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g)].map(m=>m[0]);
 if(iso.length===1&&validDate(iso[0]))date=iso[0];
 else if(iso.length||/\b(anteayer|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b|\d[/-]\d/.test(s))reasons.push('Fecha por confirmar.');
 else if(/\bayer\b/.test(s)){const d=new Date(`${today}T12:00:00Z`);d.setUTCDate(d.getUTCDate()-1);date=d.toISOString().slice(0,10);}
 if(date>today)reasons.push('No se confirma una operación futura.');
 const withoutDates=s.replace(/\b\d{4}-\d{2}-\d{2}\b/g,'');
 const candidates:{value:string;start:number;end:number}[]=[];
 const money=new RegExp(`(?:\\$\\s*(${numeric})|\\b(${numeric}|${spoken})\\s+dolares?)(?:\\s+(?:con|y)\\s+(${numeric}|${spoken})\\s+centavos?)?`,'g');
 for(const m of withoutDates.matchAll(money)){
  const main=m[1]??m[2];let value=/^\d/.test(main)?decimal(main):String(spokenInteger(main)??'');
  if(m[3]){const fraction=spokenInteger(m[3]);if(fraction===null||fraction>99||value.includes('.'))value='';else value+=`.${String(fraction).padStart(2,'0')}`;}
  candidates.push({value,start:m.index!,end:m.index!+m[0].length});
 }
 // A single numeric amount immediately after an action is also accepted.
 if(!candidates.length){const m=new RegExp(`\\b(?:gaste|pague|compre|recibi|cobre|ingreso de|gasto de)\\s+(${numeric})(?![\\d.,])`).exec(withoutDates);if(m)candidates.push({value:decimal(m[1]),start:m.index,end:m.index+m[0].length});}
 let amountCents:Cents|null=null;
 const extraNumbers=withoutDates.split('').map((c,i)=>candidates.some(m=>i>=m.start&&i<m.end)?' ':c).join('').match(/\d+/g);
 if(candidates.length===1&&!extraNumbers){try{const n=parseAmount(candidates[0].value);if(n>0)amountCents=n;}catch{/* Keep an ambiguous amount pending. */}}
 if(!amountCents)reasons.push('Falta un importe único y claro.');
 const detected=recognizedPayment(text);
 const needsPayment=reasons.length===0&&!detected;
 const selected=confirmedMethod&&['cash','check','debit','credit','bank','other'].includes(confirmedMethod)&&(kind==='expense'||confirmedMethod!=='credit')?confirmedMethod:null;
 const method=detected??selected;if(!method)reasons.push('Método de pago por confirmar.');
 const groups:Record<string,string[]>={comida:['comida','restaurante','supermercado','alimentos'],transporte:['transporte','gasolina','gas','uber','taxi'],vivienda:['vivienda','alquiler','renta'],servicios:['servicios','electricidad','agua','internet','telefono'],salud:['salud','farmacia','medicinas','medico'],salario:['salario','sueldo','nomina'],ventas:['venta','ventas'],entretenimiento:['entretenimiento','cine']};
 const active=categories.filter(c=>!c.archived&&c.kind===kind&&!isVoicePlaceholder(c.name));
 const matches=active.filter(c=>{const name=normal(c.name);const aliases=groups[name]??[name];return aliases.some(a=>new RegExp(`\\b${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\b`).test(s));});
 const category=matches.length===1?matches[0]:null;
 if(!category)reasons.push('Categoría por confirmar: elige o crea una categoría que describa la transacción.');
 return {kind,amountCents,date,category,method,ready:reasons.length===0,needsPayment:needsPayment&&!!category,reasons};
}
