import {classifyVoiceEntry} from '../documents/voiceEntry';
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
export async function loadInbox(){const ledger=await getMoneyStore();const bills=await getBillsStore(),debts=await getDebtStore();const [money,b,d,awards,drafts]=await Promise.all([ledger.snapshot(),bills.snapshot(),debts.snapshot(),ledger.read(db=>db.getAllAsync<{id:string;title:string;basis:string;earnedAt:string}>('SELECT id,title,basis,earned_at AS earnedAt FROM education_awards')),ledger.read(db=>db.getAllAsync<{id:string;text:string;createdAt:string|null}>("SELECT id,COALESCE(NULLIF(raw_text,''),description) AS text,created_at AS createdAt FROM documents WHERE source='voice' AND record_kind='note' AND movement_id IS NULL AND bill_id IS NULL AND deleted_at IS NULL AND status<>'corrected' AND supersedes_id IS NULL"))]);const today=localToday();return inboxNotices({bills:b.bills,debts:d.debts,schedules:money.schedules,awards,voiceDrafts:drafts.map(note=>{const p=classifyVoiceEntry(note.text,money.categories,today);return {id:note.id,text:note.text,date:note.createdAt?.slice(0,10)||today,kind:p.kind,categoryName:p.category?.name??null};})},today);}
