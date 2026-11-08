import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { validDate } from '../money/domain';
import { goalKinds,type GoalInput } from './types';
export function validateGoal(g:GoalInput){
 if(!g.id||!g.name.trim()||g.name.length>100||!goalKinds.some(([k])=>k===g.kind))throw new UserInputError('Revisa el nombre y tipo de meta.');
 if(cents(g.targetCents)<=0||cents(g.openingCents)<0)throw new UserInputError('Objetivo positivo y ahorro previo de cero o mayor.');
 if(g.desiredDate!==null&&!validDate(g.desiredDate))throw new UserInputError('Fecha deseada: AAAA-MM-DD o vacía.');
 if(!['weekly','monthly'].includes(g.cadence))throw new UserInputError('Frecuencia no válida.');
}
/** Porcentaje truncado a décimas, barra limitada; el excedente se muestra en dinero. */
export function goalPercent(saved:number,target:number){if(cents(saved)<0||cents(target)<=0)throw new UserInputError('Importes no válidos.');return Number(BigInt(saved)*1000n/BigInt(target))/10;}
export function suggestedContribution(saved:number,target:number,date:string|null,today:string,cadence:'weekly'|'monthly'){
 cents(saved);cents(target);
 if(!validDate(today)||date!==null&&!validDate(date))throw new UserInputError('Fecha no válida.');
 const remaining=Math.max(0,target-saved);if(!remaining)return {amountCents:0,periods:0,status:'complete' as const};
 if(!date)return {amountCents:null,periods:null,status:'missing' as const};
 if(date<=today)return {amountCents:null,periods:null,status:'due' as const};
 const days=Math.round((Date.parse(date+'T12:00:00Z')-Date.parse(today+'T12:00:00Z'))/86400000);
 // Mes equivalente de 30 días: supuesto transparente, no calendario de débitos.
 const periods=Math.max(1,Math.ceil(days/(cadence==='weekly'?7:30)));
 return {amountCents:Number((BigInt(remaining)+BigInt(periods)-1n)/BigInt(periods)),periods,status:'estimated' as const};
}
