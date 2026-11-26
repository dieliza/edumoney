import {UserInputError} from '../../core/errors';
import {cents} from '../../core/money';
import {validDate,validMonth} from '../money/domain';
export type ContributionFrequency='weekly'|'semimonthly'|'monthly'|'yearly';
export interface ContributionGoal{targetCents:number;periodStart?:string;dueDate:string;firstDate:string;frequency:ContributionFrequency}
export const contributionFrequencies=[['weekly','Semanal'],['semimonthly','Quincenal (15 y fin de mes)'],['monthly','Mensual'],['yearly','Anual']] as const;
const parts=(d:string)=>d.split('-').map(Number);
const stamp=(d:string)=>{const[y,m,day]=parts(d);return Date.UTC(y,m-1,day);};
const day=86400000;
const iso=(t:number)=>{const d=new Date(t);return `${String(d.getUTCFullYear()).padStart(4,'0')}-${String(d.getUTCMonth()+1).padStart(2,'0')}-${String(d.getUTCDate()).padStart(2,'0')}`;};
function clamped(y:number,m:number,d:number){return Date.UTC(y,m,Math.min(d,new Date(Date.UTC(y,m+1,0)).getUTCDate()));}
function halfTime(index:number){const y=Math.floor(index/24),m=Math.floor(index%24/2);return index%2===0?Date.UTC(y,m,15):Date.UTC(y,m+1,0);}
function occurrence(g:ContributionGoal,index:number){const[y,m,d]=parts(g.firstDate);if(g.frequency==='weekly')return stamp(g.firstDate)+index*7*day;if(g.frequency==='monthly')return clamped(y,m-1+index,d);if(g.frequency==='yearly')return clamped(y+index,m-1,d);if(!index)return stamp(g.firstDate);const half=y*24+(m-1)*2+(d<15?0:1)+(d===new Date(Date.UTC(y,m,0)).getUTCDate()?1:0);return halfTime(half+index-1);}
function countThrough(g:ContributionGoal,time:number){if(occurrence(g,0)>time)return 0;let hi=1;while(occurrence(g,hi)<=time)hi*=2;let lo=0;while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(occurrence(g,mid)<=time)lo=mid;else hi=mid;}return hi;}
export function validateContribution(g:ContributionGoal){if(!g||!Number.isSafeInteger(g.targetCents)||g.targetCents<=0||(g.periodStart!==undefined&&(!validDate(g.periodStart)||g.periodStart>g.dueDate))||!validDate(g.firstDate)||!validDate(g.dueDate)||g.firstDate>g.dueDate||!contributionFrequencies.some(([f])=>f===g.frequency))throw new UserInputError('Revisa el objetivo, las fechas y la frecuencia de aportación.');}
export function recommendedFirstDate(today:string,frequency:ContributionFrequency,dueDate:string){if(!validDate(today)||!validDate(dueDate))return today;const probe={targetCents:1,firstDate:today,dueDate,frequency};const next=iso(occurrence(probe,1));return next>dueDate?dueDate:next;}
export function contributionRecommendation(g:ContributionGoal,appliedCents:number,today:string,month=today.slice(0,7)){
 validateContribution(g);if(!validDate(today)||!validMonth(month)||!Number.isSafeInteger(appliedCents)||appliedCents<0)throw new UserInputError('Revisa el período y la cantidad ya aplicada.');
 const outstanding=Math.max(0,g.targetCents-appliedCents),start=countThrough(g,stamp(today)-day),end=countThrough(g,stamp(g.dueDate))-1,slots=Math.max(0,end-start+1);const overdue=g.dueDate<today;
 if(!outstanding)return{outstanding,perContribution:0,lastContribution:0,payments:0,slots,monthCents:0,nextDate:null,lastDate:null,overdue:false};
 if(!slots){const date=overdue?today:g.dueDate;return{outstanding,perContribution:outstanding,lastContribution:outstanding,payments:1,slots:1,monthCents:date.slice(0,7)===month?outstanding:0,nextDate:date,lastDate:date,overdue};}
 const regular=Number((BigInt(outstanding)+BigInt(slots)-1n)/BigInt(slots)),payments=Number((BigInt(outstanding)+BigInt(regular)-1n)/BigInt(regular)),last=cents(Number(BigInt(outstanding)-BigInt(regular)*BigInt(payments-1))),lastIndex=start+payments-1;
 const[y,m]=parts(month+'-01'),firstInMonth=countThrough(g,Date.UTC(y,m-1,1)-day),lastInMonth=countThrough(g,Date.UTC(y,m,0))-1,lo=Math.max(start,firstInMonth),hi=Math.min(lastIndex,lastInMonth),count=Math.max(0,hi-lo+1);
 const monthly=cents(Number(BigInt(regular)*BigInt(count)-(count&&hi===lastIndex?BigInt(regular-last):0n)));
 return{outstanding,perContribution:regular,lastContribution:last,payments,slots,monthCents:monthly,nextDate:iso(occurrence(g,start)),lastDate:iso(occurrence(g,lastIndex)),overdue};
}
