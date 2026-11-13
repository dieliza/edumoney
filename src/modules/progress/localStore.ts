import { getMoneyStore } from '../money/localStore';
import { ProgressStore } from './store';
let instance:Promise<ProgressStore>|undefined;
export function getProgressStore(){return instance??=getMoneyStore().then(ledger=>new ProgressStore(ledger));}
