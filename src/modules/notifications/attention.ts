import type {InboxNotice} from './domain';
import type {InboxPreferences} from './preferences';
export function pendingDictation(notice:InboxNotice){return notice.id.startsWith('voice:')&&(notice.route==='/dictations'||notice.route==='/documents');}
export function inboxAttention(notices:InboxNotice[],prefs:InboxPreferences){return prefs.enabled?notices.filter(n=>pendingDictation(n)||!prefs.read.includes(n.id)).length:0;}
