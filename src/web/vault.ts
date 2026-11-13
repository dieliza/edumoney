import type { Database, SqlJsStatic } from 'sql.js';
import type { SqlDb } from '../modules/money/store';
import { migrate } from '../storage/migrate';

type Envelope = { version: 1; salt: Uint8Array; iv: Uint8Array; ciphertext: ArrayBuffer };
const DB_NAME = 'edumoney-encrypted-web-v1';
let connection: SqlDb | undefined;
let sqlEngine: Promise<SqlJsStatic> | undefined;
let writes: Promise<unknown> = Promise.resolve();
function vaultWrite<T>(action: () => Promise<T>): Promise<T> {
  const next = writes.then(action); writes = next.catch(() => undefined); return next;
}
let rotatePassword: ((current: string, next: string) => Promise<void>) | undefined;
export async function changeWebPassword(current: string, next: string, repeat: string) {
  if (!rotatePassword) throw Error('Desbloquea EduMoney antes de cambiar la contraseña.');
  if (next.length < 12) throw Error('Usa al menos 12 caracteres.');
  if (next !== repeat) throw Error('Las contraseñas nuevas no coinciden.');
  await vaultWrite(() => rotatePassword!(current, next));
}

function record<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onupgradeneeded = () => opening.result.createObjectStore('vault');
    opening.onerror = () => reject(Error('No se pudo abrir el almacenamiento de este navegador.'));
    opening.onsuccess = () => {
      const db = opening.result;
      const tx = db.transaction('vault', mode); const request = operation(tx.objectStore('vault'));
      tx.oncomplete = () => { db.close(); resolve(request.result); };
      tx.onabort = tx.onerror = () => { db.close(); reject(Error('No se pudo guardar la copia cifrada. Revisa el espacio disponible.')); };
    };
  });
}
export async function hasWebVault() { return !!await record('readonly', s => s.get('database')); }
async function keyFor(password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: new Uint8Array(salt), iterations: 600000 }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function exclusiveTab() {
  if (!navigator.locks) throw Error('Este navegador no permite proteger los datos entre pestañas. Actualízalo para continuar.');
  await new Promise<void>((resolve, reject) => {
    void navigator.locks.request('edumoney-vault-session', { ifAvailable: true }, async lock => {
      if (!lock) { reject(Error('EduMoney está abierto en otra pestaña. Ciérrala antes de continuar aquí.')); return; }
      resolve(); await new Promise<void>(() => { /* El navegador libera la exclusión al cerrar o recargar la pestaña. */ });
    }).catch(reject);
  });
}
let tabLocked = false;
let unlocking = false;
export async function unlockWebVault(password: string) {
  if (unlocking) throw Error('Hay una apertura en curso. Espera antes de volver a entrar.');
  unlocking = true;
  try { await openWebVault(password); } finally { unlocking = false; }
}
async function openWebVault(password: string) {
  if (!globalThis.isSecureContext || !crypto.subtle) throw Error('Abre EduMoney mediante HTTPS para proteger los datos.');
  if (connection) throw Error('El espacio ya está abierto. Bloquéalo antes de volver a entrar.');
  if (!tabLocked) { await exclusiveTab(); tabLocked = true; }
  const saved = await record<Envelope | undefined>('readonly', s => s.get('database'));
  if (!saved && password.length < 12) throw Error('Usa una contraseña local de al menos 12 caracteres.');
  let salt = saved?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  let key = await keyFor(password, salt);
  let bytes: Uint8Array | undefined;
  if (saved) {
    if (saved.version !== 1) throw Error('Versión de datos web no compatible. Conserva tu respaldo.');
    try { bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(saved.iv) }, key, saved.ciphertext)); }
    catch { throw Error('Contraseña incorrecta o copia local dañada. No se modificaron los datos.'); }
  }
  if (!tabLocked) { await exclusiveTab(); tabLocked = true; }
  sqlEngine ??= import('sql.js/dist/sql-wasm-inline.js').then(m => m.default());
  const SQL = await sqlEngine; let db: Database = bytes ? new SQL.Database(bytes) : new SQL.Database();
  db.run('PRAGMA foreign_keys=ON');
  let before: Uint8Array | undefined; let recoveredRollback = false;
  const exportBytes = () => { const data = db.export(); db.run('PRAGMA foreign_keys=ON'); return data; };
  const persist = () => vaultWrite(async () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(exportBytes()));
    await record('readwrite', s => s.put({ version: 1, salt, iv, ciphertext } satisfies Envelope, 'database'));
  });
  const query = <T>(sql: string, params: (string | number | null)[]) => {
    const statement = db.prepare(sql); try { statement.bind(params); const rows: T[] = []; while (statement.step()) rows.push(statement.getAsObject() as T); return rows; } finally { statement.free(); }
  };
  const adapter: SqlDb = {
    async execAsync(sql) {
      if (/^BEGIN\b/i.test(sql.trim())) { before = exportBytes(); recoveredRollback = false; }
      if (/^ROLLBACK\b/i.test(sql.trim()) && recoveredRollback) { recoveredRollback = false; return; }
      db.run(sql);
      if (/^COMMIT\b/i.test(sql.trim())) {
        try { await persist(); before = undefined; }
        catch (error) { db.close(); db = new SQL.Database(before); db.run('PRAGMA foreign_keys=ON'); before = undefined; recoveredRollback = true; throw error; }
      }
    },
    async runAsync(sql, ...params) { db.run(sql, params); return { changes: db.getRowsModified() }; },
    async getAllAsync<T>(sql: string, ...params: (string | number | null)[]) { return query<T>(sql, params); },
    async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]) { return query<T>(sql, params)[0] ?? null; },
  };
  await migrate(adapter); if (!saved) await persist(); connection = adapter; settingsKey = key; settingsSalt = salt;
  rotatePassword = async (current, next) => {
    const stored = await record<Envelope>('readonly', s => s.get('database'));
    const oldKey = await keyFor(current, stored.salt);
    let plain: ArrayBuffer;
    try { plain = await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(stored.iv)}, oldKey, stored.ciphertext); }
    catch { throw Error('La contraseña actual no coincide. No se cambiaron los datos.'); }
    const oldSettings = await record<Envelope | undefined>('readonly', s => s.get('sync-settings'));
    const settings = oldSettings ? await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(oldSettings.iv)},oldKey,oldSettings.ciphertext) : undefined;
    const newSalt = crypto.getRandomValues(new Uint8Array(16)); const newKey = await keyFor(next,newSalt);
    const encrypt = async (data: ArrayBuffer): Promise<Envelope> => {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      return {version:1,salt:newSalt,iv,ciphertext:await crypto.subtle.encrypt({name:'AES-GCM',iv},newKey,data)};
    };
    const database = await encrypt(plain); const sync = settings ? await encrypt(settings) : undefined;
    await new Promise<void>((resolve,reject)=>{
      const opening=indexedDB.open(DB_NAME,1); opening.onerror=()=>reject(Error('No se pudo abrir el almacenamiento.'));
      opening.onsuccess=()=>{const handle=opening.result;const tx=handle.transaction('vault','readwrite');const store=tx.objectStore('vault');store.put(database,'database');if(sync)store.put(sync,'sync-settings');
        tx.oncomplete=()=>{handle.close();resolve();};tx.onabort=tx.onerror=()=>{handle.close();reject(Error('No se cambió la contraseña. Conserva la anterior.'));};};
    });
    key=newKey;salt=newSalt;settingsKey=newKey;settingsSalt=newSalt;
  };
  void navigator.storage?.persist?.().catch(() => false);
}
export async function webDatabase(): Promise<SqlDb> {
  if (!connection) throw Error('Desbloquea tu espacio local antes de continuar.');
  return connection;
}

let settingsKey: CryptoKey | undefined;
let settingsSalt: Uint8Array | undefined;
export function getWebSettings<T>(): Promise<T | undefined> { return vaultWrite(async () => {
  if (!settingsKey) throw Error('Desbloquea EduMoney.');
  const envelope = await record<Envelope | undefined>('readonly', s => s.get('sync-settings'));
  if (!envelope) return undefined;
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(envelope.iv) }, settingsKey, envelope.ciphertext);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}); }
export function setWebSettings(value: unknown) { return vaultWrite(async () => {
  if (!settingsKey || !settingsSalt) throw Error('Desbloquea EduMoney.');
  const salt = settingsSalt;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, settingsKey, new TextEncoder().encode(JSON.stringify(value)));
  await record('readwrite', s => s.put({ version: 1, salt, iv, ciphertext } satisfies Envelope, 'sync-settings'));
}); }

// Reset only after explicit on-screen confirmation. Keep the old encrypted copy
// for later recovery; never overwrite it with an empty database or a new key.
export async function resetWebVault(confirmation: string) {
  if (confirmation !== 'RESTABLECER') throw Error('Escribe RESTABLECER para confirmar.');
  if (connection || unlocking) throw Error('Bloquea EduMoney antes de restablecer.');
  if (!tabLocked) { await exclusiveTab(); tabLocked = true; }
  await new Promise<void>((resolve, reject) => {
    const opening = indexedDB.open(DB_NAME, 1);
    opening.onerror = () => reject(Error('No se pudo abrir el almacenamiento.'));
    opening.onsuccess = () => {
      const db = opening.result; const tx = db.transaction('vault', 'readwrite'); const store = tx.objectStore('vault');
      const recoveryId = 'recovery-' + crypto.randomUUID();
      const old = store.get('database'); const settings = store.get('sync-settings');
      old.onsuccess = () => { if (old.result) store.put(old.result, recoveryId + '-database'); };
      settings.onsuccess = () => { if (settings.result) store.put(settings.result, recoveryId + '-settings'); };
      store.delete('database'); store.delete('sync-settings');
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = tx.onerror = () => { db.close(); reject(Error('No se pudo restablecer. Los datos no se cambiaron.')); };
    };
  });
}
