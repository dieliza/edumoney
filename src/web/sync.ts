import {syncResponseRevision,normalizeSyncRevision} from './syncRevision';
import {SyncFailure,syncHttpFailure} from './syncErrors';
import {fetchWithTimeout} from '../core/http';
import {sha256} from '@noble/hashes/sha2.js';
import {bytesToHex,utf8ToBytes} from '@noble/hashes/utils.js';
import {syncRandom,syncEndpoint} from './syncRuntime';
import { getMoneyStore } from '../modules/money/localStore';
import { BackupStore, validatePayload, type BackupPayload } from '../modules/backup/store';
import { encryptBackup, decryptBackup } from '../modules/backup/cryptoCore';
import { getWebSettings, setWebSettings,updateWebSettings } from './syncSettings';
export type SyncSettings = { code: string; baseHash?: string; etag?: string; automatic?:boolean };
export type SyncConflict = { local: BackupPayload; remote: BackupPayload; remoteTag: string; settings: SyncSettings };
function random() { return Array.from(syncRandom(32), b => b.toString(16).padStart(2, '0')).join(''); }
export function newPairingCode() { return `EDUMONEY1.${random()}.${random()}`; }
export function parsePairingCode(code: string) { const parts = /^EDUMONEY1\.([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(code.trim()); if (!parts) throw Error('Código de enlace no válido. Copia el código completo.'); return { access: parts[1], encryption: parts[2] }; }
export async function syncSettings() { const value=await getWebSettings<SyncSettings|null>();return value?.code?value:undefined; }
export async function connectCode(code: string) { parsePairingCode(code); await setWebSettings({ code: code.trim(),automatic:true } satisfies SyncSettings); }
async function digest(payload:BackupPayload){return bytesToHex(sha256(utf8ToBytes(JSON.stringify(payload.tables))));}

async function storeSyncRevision(settings:SyncSettings,changes:Partial<SyncSettings>){await updateWebSettings<SyncSettings>(current=>current?.code===settings.code?{...current,...changes}:undefined);}


async function syncRequest(options:RequestInit){try{return await fetchWithTimeout(syncEndpoint(),options);}catch(error){const name=error&&typeof error==='object'&&'name' in error?error.name:undefined;throw new SyncFailure(name==='AbortError'||name==='TimeoutError'?'timeout':'network');}}
async function upload(local: BackupPayload, settings: SyncSettings, remoteTag?: string) {
  if(remoteTag&&!normalizeSyncRevision(remoteTag))throw new SyncFailure('version');
  const keys = parsePairingCode(settings.code);
  const body = await encryptBackup(JSON.stringify(local), keys.encryption, async n => syncRandom(n));
  if (body.length > 16 * 1024 * 1024) throw new SyncFailure('size');
  const response = await syncRequest( { method: 'PUT', headers: { Authorization: `Bearer ${keys.access}`, 'Content-Type': 'application/json', ...(remoteTag ? { 'If-Match': normalizeSyncRevision(remoteTag)! } : { 'If-None-Match': '*' }) }, body, cache: 'no-store',keepalive:body.length<60000 });
  if (!response.ok) throw syncHttpFailure(response.status);
  const confirmedTag=syncResponseRevision(response);if(!confirmedTag)throw new SyncFailure('version');
  await storeSyncRevision(settings,{baseHash:await digest(local),etag:confirmedTag});
}
let operations:Promise<unknown>=Promise.resolve();
export function synchronize(options:{uploadOnly?:boolean}={}):Promise<{message:string;conflict?:SyncConflict}>{const next=operations.then(()=>performSync(options));operations=next.catch(()=>{});return next;}
async function performSync(options:{uploadOnly?:boolean}): Promise<{ message: string; conflict?: SyncConflict }> {
  const settings = await syncSettings(); if (!settings) throw Error('Enlaza primero tus dispositivos.');
  const keys = parsePairingCode(settings.code); const store = new BackupStore(await getMoneyStore()); const local = await store.snapshot();
  const response = await syncRequest( { headers: { Authorization: `Bearer ${keys.access}` }, cache: 'no-store' });
  if (response.status === 404) { await upload(local, settings); return { message: 'Copia cifrada enviada. Puedes enlazar el otro dispositivo con tu código privado.' }; }
  if (response.status === 410) throw Error('Este enlace fue eliminado. Crea uno nuevo para volver a sincronizar.');
  if (!response.ok) throw syncHttpFailure(response.status);
  const tag = syncResponseRevision(response); if (!tag) throw new SyncFailure('version');
  const remote: unknown = JSON.parse(await decryptBackup(await response.text(), keys.encryption)); validatePayload(remote);
  const localHash = await digest(local), remoteHash = await digest(remote);
  if (localHash === remoteHash) { await storeSyncRevision(settings,{baseHash:localHash,etag:tag}); return { message: 'Ambos dispositivos tienen los mismos registros.' }; }
  if (settings.baseHash && remoteHash === settings.baseHash) { await upload(local, settings, tag); return { message: 'Tus cambios se enviaron cifrados. Sincroniza el otro dispositivo para recibirlos.' }; }
  if (!options.uploadOnly && settings.baseHash && localHash === settings.baseHash) { await store.restore(remote, 'RESTAURAR', JSON.stringify(local.tables)); await storeSyncRevision(settings,{baseHash:remoteHash,etag:tag}); return { message: 'Recibiste los cambios del otro dispositivo. Tus registros ya están actualizados.' }; }
  return { message: 'Revisa antes de continuar: hay datos distintos o este es el primer enlace. Ninguna copia se reemplazó.', conflict: { local, remote, remoteTag: tag, settings } };
}
export async function resolveSync(conflict: SyncConflict, choice: 'local' | 'remote', confirmation: string) {
  if (confirmation !== 'REEMPLAZAR') throw Error('Escribe REEMPLAZAR para confirmar la copia elegida.');
  const store = new BackupStore(await getMoneyStore());
  if (JSON.stringify((await store.snapshot()).tables) !== JSON.stringify(conflict.local.tables)) throw Error('Los registros locales cambiaron. Vuelve a sincronizar antes de elegir.');
  if (choice === 'local') { await upload(conflict.local, conflict.settings, conflict.remoteTag); return 'Copia local enviada cifrada; se conservó la versión que elegiste.'; }
  const keys = parsePairingCode(conflict.settings.code);
  const response = await syncRequest( { headers: { Authorization: `Bearer ${keys.access}` }, cache: 'no-store' });
  if (!response.ok || syncResponseRevision(response) !== normalizeSyncRevision(conflict.remoteTag)) throw Error('La copia remota cambió. Vuelve a sincronizar para revisarla.');
  await store.restore(conflict.remote, 'RESTAURAR', JSON.stringify(conflict.local.tables));
  await storeSyncRevision(conflict.settings,{baseHash:await digest(conflict.remote),etag:conflict.remoteTag});
  return 'Copia del otro dispositivo recibida. Los datos locales se reemplazaron según tu elección.';
}
export async function disconnectSync() { await setWebSettings({automatic:false}); }
export async function deleteRemoteCopy(confirmation: string) {
  if (confirmation !== 'ELIMINAR') throw Error('Escribe ELIMINAR para borrar la copia del servidor.');
  const settings = await syncSettings(); if (!settings) return;
  const keys = parsePairingCode(settings.code); const headers = { Authorization: `Bearer ${keys.access}` };
  const response = await syncRequest( { headers, cache: 'no-store' });
  if (response.status !== 404 && response.status !== 410) {
    const tag = syncResponseRevision(response); if (!response.ok || !tag) throw Error('No se pudo verificar la copia remota.');
    const deleted = await syncRequest( { method: 'DELETE', headers: { ...headers, 'If-Match': tag }, cache: 'no-store' });
    if (!deleted.ok) throw Error('La copia remota cambió o no se pudo eliminar. Vuelve a revisarla.');
  }
  await disconnectSync();
}

/** Fresh vaults get independent random access/encryption keys, never a shared user code. */
export async function ensureAutomaticSync(){let enabled=true;await updateWebSettings<SyncSettings>(value=>{if(value?.automatic===false){enabled=false;return undefined;}if(value?.code)return undefined;return {code:newPairingCode(),automatic:true};});return enabled;}
