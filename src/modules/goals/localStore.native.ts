import { getMoneyStore } from '../money/localStore';
import { GoalStore } from './store';
let instance:Promise<GoalStore>|undefined;
export function getGoalStore(){return instance??=getMoneyStore().then(ledger=>new GoalStore(ledger));}
