import { getMoneyStore } from '../money/localStore';
import { EducationStore } from './store';
export function getEducationStore(){return getMoneyStore().then(ledger=>new EducationStore(ledger));}
