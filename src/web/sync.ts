import { getMoneyStore } from '../modules/money/localStore';
import { BackupStore, validatePayload, type BackupPayload } from '../modules/backup/store';
import { encryptBackup, decryptBackup } from '../modules/backup/cryptoCore';
import { getWebSettings, setWebSettings } from './vault';
export type SyncSettings = { code: string; baseHash?: string; etag?: string };
export type SyncConflict = { local: BackupPayload; remote: BackupPayload; remoteTag: string; settings: SyncSettings };
function random() { return Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join(''); }
export function newPairingCode() { return `EDUMONEY1.${random()}.${random()}`; }
export function parsePairingCode(code: string) { const parts = /^EDUMONEY1\.([a-f0-9]{64})\.([a-f0-9]{64})$/.exec(code.trim()); if (!parts) throw Error('Código de enlace no válido. Copia el código completo.'); return { access: parts[1], encryption: parts[2] }; }
export async function syncSettings() { return (await getWebSettings<SyncSettings | null>()) ?? undefined; }
export async function connectCode(code: string) { parsePairingCode(code); await setWebSettings({ code: code.trim() } satisfies SyncSettings); }
async function digest(payload: BackupPayload) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload.tables)))), b => b.toString(16).padStart(2, '0')).join(''); }
async function upload(local: BackupPayload, settings: SyncSettings, remoteTag?: string) {
  const keys = parsePairingCode(settings.code);
  const body = await encryptBackup(JSON.stringify(local), keys.encryption, async n => crypto.getRandomValues(new Uint8Array(n)));
  if (body.length > 16 * 1024 * 1024) throw Error('La copia cifrada supera 16 MB. Reduce las copias de imágenes o conserva un respaldo local; tus registros no se modificaron.');
  const response = await fetch('/api/sync', { method: 'PUT', headers: { Authorization: `Bearer ${keys.access}`, 'Content-Type': 'application/json', ...(remoteTag ? { 'If-Match': remoteTag } : { 'If-None-Match': '*' }) }, body, cache: 'no-store' });
  if (response.status === 409 || response.status === 412) throw Error('Otro dispositivo sincronizó mientras enviabas. Vuelve a sincronizar para revisar ambos cambios.');
  if (!response.ok) throw Error('No se pudo enviar la copia cifrada. Los registros locales se conservan.');
  await setWebSettings({ ...settings, baseHash: await digest(local), etag: response.headers.get('ETag') ?? undefined });
}
export async function synchronize(): Promise<{ message: string; conflict?: SyncConflict }> {
  const settings = await syncSettings(); if (!settings) throw Error('Enlaza primero tus dispositivos.');
  const keys = parsePairingCode(settings.code); const store = new BackupStore(await getMoneyStore()); const local = await store.snapshot();
  const response = await fetch('/api/sync', { headers: { Authorization: `Bearer ${keys.access}` }, cache: 'no-store' });
  if (response.status === 404) { await upload(local, settings); return { message: 'Copia cifrada enviada. Puedes enlazar el otro dispositivo con tu código privado.' }; }
  if (response.status === 410) throw Error('Este enlace fue eliminado. Crea uno nuevo para volver a sincronizar.');
  if (!response.ok) throw Error('No se pudo consultar la sincronización. Puedes continuar usando los registros locales.');
  const tag = response.headers.get('ETag'); if (!tag) throw Error('La respuesta de sincronización no tiene una versión verificable.');
  const remote: unknown = JSON.parse(await decryptBackup(await response.text(), keys.encryption)); validatePayload(remote);
  const localHash = await digest(local), remoteHash = await digest(remote);
  if (localHash === remoteHash) { await setWebSettings({ ...settings, baseHash: localHash, etag: tag }); return { message: 'Ambos dispositivos tienen los mismos registros.' }; }
  if (settings.baseHash && remoteHash === settings.baseHash) { await upload(local, settings, tag); return { message: 'Tus cambios se enviaron cifrados. Sincroniza el otro dispositivo para recibirlos.' }; }
  if (settings.baseHash && localHash === settings.baseHash) { await store.restore(remote, 'RESTAURAR', JSON.stringify(local.tables)); await setWebSettings({ ...settings, baseHash: remoteHash, etag: tag }); return { message: 'Recibiste los cambios del otro dispositivo. Tus registros ya están actualizados.' }; }
  return { message: 'Revisa antes de continuar: hay datos distintos o este es el primer enlace. Ninguna copia se reemplazó.', conflict: { local, remote, remoteTag: tag, settings } };
}
export async function resolveSync(conflict: SyncConflict, choice: 'local' | 'remote', confirmation: string) {
  if (confirmation !== 'REEMPLAZAR') throw Error('Escribe REEMPLAZAR para confirmar la copia elegida.');
  const store = new BackupStore(await getMoneyStore());
  if (JSON.stringify((await store.snapshot()).tables) !== JSON.stringify(conflict.local.tables)) throw Error('Los registros locales cambiaron. Vuelve a sincronizar antes de elegir.');
  if (choice === 'local') { await upload(conflict.local, conflict.settings, conflict.remoteTag); return 'Copia local enviada cifrada; se conservó la versión que elegiste.'; }
  const keys = parsePairingCode(conflict.settings.code);
  const response = await fetch('/api/sync', { headers: { Authorization: `Bearer ${keys.access}` }, cache: 'no-store' });
  if (!response.ok || response.headers.get('ETag') !== conflict.remoteTag) throw Error('La copia remota cambió. Vuelve a sincronizar para revisarla.');
  await store.restore(conflict.remote, 'RESTAURAR', JSON.stringify(conflict.local.tables));
  await setWebSettings({ ...conflict.settings, baseHash: await digest(conflict.remote), etag: conflict.remoteTag });
  return 'Copia del otro dispositivo recibida. Los datos locales se reemplazaron según tu elección.';
}
export async function disconnectSync() { await setWebSettings(null); }
export async function deleteRemoteCopy(confirmation: string) {
  if (confirmation !== 'ELIMINAR') throw Error('Escribe ELIMINAR para borrar la copia del servidor.');
  const settings = await syncSettings(); if (!settings) return;
  const keys = parsePairingCode(settings.code); const headers = { Authorization: `Bearer ${keys.access}` };
  const response = await fetch('/api/sync', { headers, cache: 'no-store' });
  if (response.status !== 404 && response.status !== 410) {
    const tag = response.headers.get('ETag'); if (!response.ok || !tag) throw Error('No se pudo verificar la copia remota.');
    const deleted = await fetch('/api/sync', { method: 'DELETE', headers: { ...headers, 'If-Match': tag }, cache: 'no-store' });
    if (!deleted.ok) throw Error('La copia remota cambió o no se pudo eliminar. Vuelve a revisarla.');
  }
  await disconnectSync();
}
