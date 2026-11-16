/** Stable object revision, independent of an intermediary's compressed HTTP representation. */
export const SYNC_REVISION_HEADER='X-EduMoney-Sync-Version';
export function normalizeSyncRevision(value:string|null|undefined){if(!value)return null;const tag=value.startsWith('W/')?value.slice(2):value;return /^"[a-fA-F0-9-]+"$/.test(tag)?tag:null;}
export function syncResponseRevision(response:Pick<Response,'headers'>){return normalizeSyncRevision(response.headers.get(SYNC_REVISION_HEADER))??normalizeSyncRevision(response.headers.get('ETag'));}
