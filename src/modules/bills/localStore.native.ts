import { getMoneyStore } from '../money/localStore';
import { BillsStore } from './store';
let instance:Promise<BillsStore>|undefined;
export function getBillsStore(){return instance??=getMoneyStore().then(ledger=>new BillsStore(ledger));}
