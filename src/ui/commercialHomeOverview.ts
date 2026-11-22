import {monthlySummary} from '../modules/money/domain';
import {cents} from '../core/money';
import {commercialAmount} from '../modules/business/ledgerDomain';
import type {BusinessLedgerSnapshot} from '../modules/business/ledgerTypes';
import type {Category,LedgerMovement} from '../modules/money/types';
export function commercialHomeOverview(data:BusinessLedgerSnapshot,categories:Category[],month:string){
 const originals=new Map(data.movements.map(m=>[m.id,m]));
 const movements:LedgerMovement[]=data.entries.filter(e=>!e.deletedAt&&!e.stale&&e.date.startsWith(month)).flatMap(e=>{
  const m=originals.get(e.movementId),amount=commercialAmount(e);
  if(!m||m.deletedAt||m.version!==e.movementVersion||m.kind!==e.kind||amount===null||amount<=0)return [];
  // The copy is only for the shared chart model; persisted business classification is untouched.
  return [{...m,amountCents:cents(amount),useKind:'personal' as const}];
 });
 const summary=monthlySummary({movements,categories,budgets:[],schedules:[],commitments:[]},month);
 return {summary,movements,categories};
}
