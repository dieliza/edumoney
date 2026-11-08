import { openLocalDatabase } from '../../storage/database';
import { MoneyStore } from './store';
let instance:Promise<MoneyStore>|undefined;
export function getMoneyStore(){return instance ??= openLocalDatabase().then(db=>new MoneyStore(db));}
export const isPreview = false;
