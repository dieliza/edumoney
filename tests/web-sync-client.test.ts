import { expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { cents } from '../src/core/money';
import type { LedgerMovement } from '../src/modules/money/types';
import { handleSync } from '../web-server/sync.mjs';

it('sincroniza dos dispositivos cifrados, detecta conflicto y conserva la elección confirmada', async () => {
  const rows = new Map<string, { bytes: Uint8Array; tag: string }>(); let version = 0;
  const BUCKET = { async get(key: string) { const r = rows.get(key); return r ? { body: new Blob([new Uint8Array(r.bytes)]).stream(), httpEtag: r.tag } : null; }, async put(key: string, bytes: Uint8Array, options: { onlyIf: Headers }) { const old = rows.get(key); if (options.onlyIf.get('If-None-Match') === '*' && old || options.onlyIf.has('If-Match') && old?.tag !== options.onlyIf.get('If-Match')) return null; const tag = `"${(++version).toString(16)}"`; rows.set(key, { bytes, tag }); return { httpEtag: tag }; } };
  vi.stubGlobal('fetch', async (path: string, init: RequestInit) => handleSync(new Request(new URL(path, 'https://edumoney.test'), init), { BUCKET }));
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('navigator', { locks: { request: async (_n: string, _o: unknown, f: (lock: object) => Promise<void>) => f({}) }, storage: { persist: async () => true } });
  async function device() { vi.resetModules(); const idb = new IDBFactory(); vi.stubGlobal('indexedDB', idb); const vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); const sync = await import('../src/web/sync'); const { getMoneyStore } = await import('../src/modules/money/localStore'); return { idb, sync, store: await getMoneyStore() }; }
  const a = await device(); const code = a.sync.newPairingCode(); await a.sync.connectCode(code);
  const entry = (id: string, kind: 'income' | 'expense', amount: number): LedgerMovement => ({ id, idempotencyKey: id, kind, amountCents: cents(amount), currency: 'USD', date: '2026-11-13', description: id, categoryId: null, paymentMethod: 'check', taxReview: false, useKind: 'personal', grossCents: null, withholdingCents: null, createdAt: '2026-11-13T00:00:00Z', updatedAt: '2026-11-13T00:00:00Z', deletedAt: null, incomeType: 'manual', scheduleId: null, occurrenceDate: null, version: 1 });
  await a.store.create(entry('Ingreso FICTICIO A', 'income', 10000)); await a.sync.synchronize();
  expect(new TextDecoder().decode([...rows.values()][0].bytes)).not.toContain('Ingreso FICTICIO');
  const b = await device(); await b.sync.connectCode(code); const first = await b.sync.synchronize(); expect(first.conflict).toBeTruthy();
  await expect(b.sync.resolveSync(first.conflict!, 'remote', 'NO')).rejects.toThrow('REEMPLAZAR');
  await b.sync.resolveSync(first.conflict!, 'remote', 'REEMPLAZAR'); expect((await b.store.snapshot()).movements).toHaveLength(1);
  await b.store.create(entry('Gasto FICTICIO B', 'expense', 2000)); await b.sync.synchronize();
  vi.stubGlobal('indexedDB', a.idb); expect((await a.sync.synchronize()).conflict).toBeUndefined(); expect((await a.store.snapshot()).movements).toHaveLength(2);
  await a.store.create(entry('Cambio FICTICIO A', 'expense', 1000)); await a.sync.synchronize();
  vi.stubGlobal('indexedDB', b.idb); await b.store.create(entry('Cambio FICTICIO B', 'income', 5000)); const conflict = await b.sync.synchronize(); expect(conflict.conflict).toBeTruthy();
  expect((await b.store.snapshot()).movements.some(m => m.description === 'Cambio FICTICIO B')).toBe(true);
  await b.sync.resolveSync(conflict.conflict!, 'local', 'REEMPLAZAR');
  vi.stubGlobal('indexedDB', a.idb); await a.sync.synchronize(); expect((await a.store.snapshot()).movements.some(m => m.description === 'Cambio FICTICIO B')).toBe(true);
  vi.unstubAllGlobals();
}, 45000);
