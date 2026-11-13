import type { Database, SqlJsStatic } from 'sql.js';
import type { SqlDb } from '../modules/money/store';
import { migrate } from '../storage/migrate';

type Envelope = { version: 1; salt: Uint8Array; iv: Uint8Array; ciphertext: ArrayBuffer };
const DB_NAME = 'edumoney-encrypted-web-v1';
let connection: SqlDb | undefined;
let sqlEngine: Promise<SqlJsStatic> | undefined;
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
export async function unlockWebVault(password: string) {
  if (!globalThis.isSecureContext || !crypto.subtle) throw Error('Abre EduMoney mediante HTTPS para proteger los datos.');
  const saved = await record<Envelope | undefined>('readonly', s => s.get('database'));
  if (!saved && password.length < 12) throw Error('Usa una contraseña local de al menos 12 caracteres.');
  const salt = saved?.salt ?? crypto.getRandomValues(new Uint8Array(16));
  const key = await keyFor(password, salt);
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
  const persist = async () => {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new Uint8Array(exportBytes()));
    await record('readwrite', s => s.put({ version: 1, salt, iv, ciphertext } satisfies Envelope, 'database'));
  };
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
  void navigator.storage?.persist?.().catch(() => false);
}
export async function webDatabase(): Promise<SqlDb> {
  if (!connection) throw Error('Desbloquea tu espacio local antes de continuar.');
  return connection;
}

let settingsKey: CryptoKey | undefined;
let settingsSalt: Uint8Array | undefined;
export async function getWebSettings<T>(): Promise<T | undefined> {
  if (!settingsKey) throw Error('Desbloquea EduMoney.');
  const envelope = await record<Envelope | undefined>('readonly', s => s.get('sync-settings'));
  if (!envelope) return undefined;
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(envelope.iv) }, settingsKey, envelope.ciphertext);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
export async function setWebSettings(value: unknown) {
  if (!settingsKey || !settingsSalt) throw Error('Desbloquea EduMoney.');
  const salt = settingsSalt;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, settingsKey, new TextEncoder().encode(JSON.stringify(value)));
  await record('readwrite', s => s.put({ version: 1, salt, iv, ciphertext } satisfies Envelope, 'sync-settings'));
}
