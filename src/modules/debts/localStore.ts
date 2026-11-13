import { getMoneyStore } from '../money/localStore';
import { DebtStore } from './store';
let instance:Promise<DebtStore>|undefined;
export function getDebtStore(){return instance??=getMoneyStore().then(ledger=>new DebtStore(ledger));}
