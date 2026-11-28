import {validDate} from '../money/domain';
export function nextIraDate(date:string,cadence:'weekly'|'biweekly'|'monthly'|'yearly'){
 if(!validDate(date))throw Error('Fecha inválida.');const [y,m,d]=date.split('-').map(Number);const next=new Date(Date.UTC(y,m-1,d));if(cadence==='weekly'||cadence==='biweekly')next.setUTCDate(d+(cadence==='weekly'?7:14));else{const month=m-1+(cadence==='yearly'?12:1);next.setUTCDate(1);next.setUTCFullYear(y);next.setUTCMonth(month);const last=new Date(Date.UTC(next.getUTCFullYear(),next.getUTCMonth()+1,0)).getUTCDate();next.setUTCDate(Math.min(d,last));}return next.toISOString().slice(0,10);
}
