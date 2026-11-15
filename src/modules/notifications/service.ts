import AsyncStorage from '@react-native-async-storage/async-storage';
import {getMoneyStore} from '../money/localStore';
import {getBillsStore} from '../bills/localStore';
import {getDebtStore} from '../debts/localStore';
import {localToday} from '../money/domain';
import {inboxNotices} from './domain';
import {NotificationPreferences} from './preferences';
import {notificationScope} from './scope';
const spaces=new Map<string,NotificationPreferences>();
export async function inboxPreferences(){const scope=await notificationScope();let preferences=spaces.get(scope);if(!preferences){preferences=new NotificationPreferences(AsyncStorage,scope);spaces.set(scope,preferences);}return preferences;}
export async function loadInbox(){const ledger=await getMoneyStore();const bills=await getBillsStore(),debts=await getDebtStore();const [money,b,d,awards]=await Promise.all([ledger.snapshot(),bills.snapshot(),debts.snapshot(),ledger.read(db=>db.getAllAsync<{id:string;title:string;basis:string;earnedAt:string}>('SELECT id,title,basis,earned_at AS earnedAt FROM education_awards'))]);return inboxNotices({bills:b.bills,debts:d.debts,schedules:money.schedules,awards},localToday());}
