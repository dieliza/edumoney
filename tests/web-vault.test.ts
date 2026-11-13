import { beforeEach, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { MoneyStore } from '../src/modules/money/store';
import { cents } from '../src/core/money';
import type { LedgerMovement } from '../src/modules/money/types';
let denied = false;
beforeEach(() => {
  vi.resetModules(); denied = false;
  vi.stubGlobal('indexedDB', new IDBFactory()); vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', { locks: { request: async (_name: string, _options: unknown, action: (lock: object | null) => Promise<void>) => action(denied ? null : {}) }, storage: { persist: async () => true } });
});
const movement: LedgerMovement = { id: 'web-ficticio', idempotencyKey: 'web-ficticio', kind: 'income', amountCents: cents(10000), currency: 'USD', date: '2026-11-13', description: 'Ingreso FICTICIO secreto', categoryId: null, paymentMethod: 'check', taxReview: false, useKind: 'personal', grossCents: null, withholdingCents: null, createdAt: '2026-11-13T00:00:00Z', updatedAt: '2026-11-13T00:00:00Z', deletedAt: null, incomeType: 'manual', scheduleId: null, occurrenceDate: null, version: 1 };
it('crea datos reales, cifra y recupera tras una nueva sesión sin contraseña guardada', async () => {
  let vault = await import('../src/web/vault');
  expect(await vault.hasWebVault()).toBe(false);
  await vault.unlockWebVault('Contraseña-FICTICIA-2026'); const store = new MoneyStore(await vault.webDatabase()); await store.create(movement);
  const raw = await new Promise<unknown>(resolve => { const op = indexedDB.open('edumoney-encrypted-web-v1'); op.onsuccess = () => { const db = op.result; const tx = db.transaction('vault'); const r = tx.objectStore('vault').get('database'); r.onsuccess = () => resolve(r.result); tx.oncomplete = () => db.close(); }; });
  expect(new TextDecoder().decode(new Uint8Array((raw as {ciphertext:ArrayBuffer}).ciphertext))).not.toContain('Ingreso FICTICIO secreto'); expect(new TextDecoder().decode(new Uint8Array((raw as {ciphertext:ArrayBuffer}).ciphertext))).not.toContain('SQLite format'); expect(JSON.stringify(raw)).not.toContain('FICTICIO'); expect(JSON.stringify(raw)).not.toContain('Contraseña');
  vi.resetModules(); vault = await import('../src/web/vault');
  await expect(vault.unlockWebVault('Contraseña-incorrecta')).rejects.toThrow('Contraseña incorrecta');
  await vault.unlockWebVault('Contraseña-FICTICIA-2026');
  expect((await new MoneyStore(await vault.webDatabase()).snapshot()).movements[0]).toMatchObject({ description: movement.description, paymentMethod: 'check', amountCents: 10000 });
});
it('revierte operaciones fallidas sin persistir escrituras parciales', async () => {
  const vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); const store = new MoneyStore(await vault.webDatabase());
  await expect(store.transaction(async db => { await db.runAsync("INSERT INTO categories(id,name,kind) VALUES('fallo','FICTICIA','income')"); throw Error('Interrupción'); })).rejects.toThrow('Interrupción');
  expect((await store.snapshot()).categories.some(c => c.id === 'fallo')).toBe(false);
});
it('no abre otra pestaña escritora ni admite una contraseña inicial corta', async () => {
  const vault = await import('../src/web/vault'); await expect(vault.unlockWebVault('corta')).rejects.toThrow('12 caracteres'); denied = true; vi.resetModules(); const other = await import('../src/web/vault');
  await expect(other.unlockWebVault('Contraseña-FICTICIA-2026')).rejects.toThrow('otra pestaña');
});
it('protege el código de enlace con la clave local y lo conserva al reabrir', async () => {
  let vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); await vault.setWebSettings({ code: 'CODIGO-FICTICIO' });
  vi.resetModules(); vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); expect(await vault.getWebSettings()).toEqual({ code: 'CODIGO-FICTICIO' });
});
it('rechaza alteración del cifrado sin abrir una base vacía', async () => {
  let vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026');
  await new Promise<void>((resolve, reject) => { const open = indexedDB.open('edumoney-encrypted-web-v1'); open.onsuccess = () => { const db = open.result; const tx = db.transaction('vault', 'readwrite'); const store = tx.objectStore('vault'); const read = store.get('database'); read.onsuccess = () => { const record = read.result; const bytes = new Uint8Array(record.ciphertext); bytes[0] ^= 1; store.put({ ...record, ciphertext: bytes.buffer }, 'database'); }; tx.oncomplete = () => { db.close(); resolve(); }; tx.onerror = () => reject(tx.error); }; });
  vi.resetModules(); vault = await import('../src/web/vault'); await expect(vault.unlockWebVault('Contraseña-FICTICIA-2026')).rejects.toThrow('dañada'); expect(await vault.hasWebVault()).toBe(true);
});
it('impide reemplazar datos si una operación local cambió durante la sincronización', async () => {
  const vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); const ledger = new MoneyStore(await vault.webDatabase()); await ledger.create(movement);
  const { BackupStore } = await import('../src/modules/backup/store'); const backup = new BackupStore(ledger); const previous = await backup.snapshot();
  await ledger.create({ ...movement, id: 'cambio-ficticio', idempotencyKey: 'cambio-ficticio', description: 'Cambio FICTICIO durante red', amountCents: cents(20000) });
  await expect(backup.restore(previous, 'RESTAURAR', JSON.stringify(previous.tables))).rejects.toThrow('cambiaron'); expect((await ledger.snapshot()).movements).toHaveLength(2);
});
it('restablece solo con confirmación y permite una nueva contraseña tras cerrar', async () => {
  let vault = await import('../src/web/vault'); await vault.unlockWebVault('Anterior-FICTICIA-2026');
  await new MoneyStore(await vault.webDatabase()).create(movement);
  vi.resetModules(); vault = await import('../src/web/vault');
  await expect(vault.resetWebVault('')).rejects.toThrow('RESTABLECER');
  expect(await vault.hasWebVault()).toBe(true);
  await vault.resetWebVault('RESTABLECER'); expect(await vault.hasWebVault()).toBe(false);
  await vault.unlockWebVault('Nueva-FICTICIA-2026');
  expect((await new MoneyStore(await vault.webDatabase()).snapshot()).movements).toHaveLength(0);
  vi.resetModules(); vault = await import('../src/web/vault');
  await vault.unlockWebVault('Nueva-FICTICIA-2026');
  expect(await vault.hasWebVault()).toBe(true);
});
it('rechaza una segunda apertura que podría conservar una clave obsoleta', async () => {
  const vault = await import('../src/web/vault'); await vault.unlockWebVault('Inicial-FICTICIA-2026');
  await expect(vault.unlockWebVault('Otra-FICTICIA-2026')).rejects.toThrow('ya está abierto');
  await expect(vault.resetWebVault('RESTABLECER')).rejects.toThrow('Bloquea');
  await new MoneyStore(await vault.webDatabase()).create(movement);
  vi.resetModules(); const reopened = await import('../src/web/vault');
  await reopened.unlockWebVault('Inicial-FICTICIA-2026');
  expect((await new MoneyStore(await reopened.webDatabase()).snapshot()).movements).toHaveLength(1);
});
it('cambia contraseña conservando movimientos, enlace y escrituras posteriores', async () => {
  let vault=await import('../src/web/vault');await vault.unlockWebVault('Original-FICTICIA-2026');
  const ledger=new MoneyStore(await vault.webDatabase());await ledger.create(movement);
  await vault.setWebSettings({code:'ENLACE-FICTICIO'});
  await vault.changeWebPassword('Original-FICTICIA-2026','Nueva-FICTICIA-2026','Nueva-FICTICIA-2026');
  expect(await vault.getWebSettings()).toEqual({code:'ENLACE-FICTICIO'});
  await ledger.create({...movement,id:'segundo',idempotencyKey:'segundo',description:'Segundo ingreso FICTICIO'});
  vi.resetModules();vault=await import('../src/web/vault');
  await expect(vault.unlockWebVault('Original-FICTICIA-2026')).rejects.toThrow('Contraseña incorrecta');
  await vault.unlockWebVault('Nueva-FICTICIA-2026');
  expect((await new MoneyStore(await vault.webDatabase()).snapshot()).movements).toHaveLength(2);
  expect(await vault.getWebSettings()).toEqual({code:'ENLACE-FICTICIO'});
});
it('no cambia contraseña con contraseña actual incorrecta o confirmación distinta', async()=>{
  let vault=await import('../src/web/vault');await vault.unlockWebVault('Original-FICTICIA-2026');
  await expect(vault.changeWebPassword('incorrecta','Nueva-FICTICIA-2026','Nueva-FICTICIA-2026')).rejects.toThrow('actual no coincide');
  await expect(vault.changeWebPassword('Original-FICTICIA-2026','Nueva-FICTICIA-2026','distinta')).rejects.toThrow('no coinciden');
  await expect(vault.changeWebPassword('Original-FICTICIA-2026','corta','corta')).rejects.toThrow('12 caracteres');
  vi.resetModules();vault=await import('../src/web/vault');await vault.unlockWebVault('Original-FICTICIA-2026');
});
it('serializa la actualización del enlace junto con la rotación de contraseña',async()=>{
  let vault=await import('../src/web/vault');await vault.unlockWebVault('Original-FICTICIA-2026');
  await Promise.all([vault.changeWebPassword('Original-FICTICIA-2026','Nueva-FICTICIA-2026','Nueva-FICTICIA-2026'),vault.setWebSettings({code:'ENLACE-NUEVO-FICTICIO'})]);
  vi.resetModules();vault=await import('../src/web/vault');await vault.unlockWebVault('Nueva-FICTICIA-2026');
  expect(await vault.getWebSettings()).toEqual({code:'ENLACE-NUEVO-FICTICIO'});
});
