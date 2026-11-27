import {contributionRecommendation,recommendedFirstDate,type ContributionFrequency} from '../budget/contributions';
import {validDate} from '../money/domain';
import type {Goal} from './types';
/** Stages are monetary thresholds, never synthetic payments or transactions. */
export function goalRace(g:Goal,today:string){
 const start=g.trackStartDate&&validDate(g.trackStartDate)?g.trackStartDate:today;
 const frequency:ContributionFrequency=g.cadence==='biweekly'?'semimonthly':g.cadence;
 const due=g.desiredDate&&validDate(g.desiredDate)?g.desiredDate:start;
 const plan=contributionRecommendation({targetCents:g.targetCents,dueDate:due,firstDate:recommendedFirstDate(start,frequency,due),frequency},0,start);
 const count=plan.payments,regular=plan.perContribution,saved=Math.max(0,Math.min(g.savedCents,g.targetCents));
 const completed=saved>=g.targetCents?count:Number(BigInt(saved)/BigInt(regular));
 const stage=(index:number)=>{if(!Number.isSafeInteger(index)||index<1||index>count)throw new Error('Etapa no válida');const threshold=Number(BigInt(index)*BigInt(regular)>BigInt(g.targetCents)?BigInt(g.targetCents):BigInt(index)*BigInt(regular));const previous=Number(BigInt(index-1)*BigInt(regular));return{index,threshold,amount:threshold-previous,paid:Math.max(0,Math.min(saved-previous,threshold-previous)),complete:saved>=threshold};};
 let hash=0;for(const c of g.id)hash=(hash*31+c.charCodeAt(0))>>>0;
 return{count,regular,last:plan.lastContribution,completed,stage,color:['#007F86','#7451B2','#B36B00','#176BA0','#AC3474','#387F4D'][hash%6],complete:saved>=g.targetCents,missingDate:!g.desiredDate||!validDate(g.desiredDate)};
}
