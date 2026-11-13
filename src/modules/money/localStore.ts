import { webDatabase } from '../../web/vault';
import { MoneyStore } from './store';
let instance:Promise<MoneyStore>|undefined;
export function getMoneyStore(){return instance ??= webDatabase().then(db=>new MoneyStore(db));}
export const isPreview = false;
