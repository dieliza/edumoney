import type {MoneyStore} from './store';
import type {IncomeSchedule,LedgerMovement} from './types';
import type {AccountScope} from './accountScope';
/** Account selection, never a category label, determines where a new transaction is posted. */
export async function saveAccountMovement(store:Pick<MoneyStore,'create'|'saveCommercial'>,m:LedgerMovement,account:AccountScope,holderId:string,allowDuplicate=false,schedule?:IncomeSchedule){
 if(account==='business')return store.saveCommercial({...m,useKind:'business',taxReview:true},holderId,allowDuplicate);
 return store.create({...m,useKind:'personal',taxReview:false},allowDuplicate,schedule);
}
