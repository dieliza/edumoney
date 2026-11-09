import { getMoneyStore } from '../money/localStore';
import { TaxStore } from './store';
let instance:Promise<TaxStore>|undefined;
export function getTaxStore(){return instance??=getMoneyStore().then(ledger=>new TaxStore(ledger));}
