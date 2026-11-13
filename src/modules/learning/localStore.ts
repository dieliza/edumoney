import { getMoneyStore } from '../money/localStore';
import { LearningStore } from './store';
let instance:Promise<LearningStore>|undefined;
export function getLearningStore(){return instance??=getMoneyStore().then(ledger=>new LearningStore(ledger));}
