import { expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { cents } from '../src/core/money';
import type { LedgerMovement } from '../src/modules/money/types';
import {IncomeStore} from '../src/modules/income/store';
import {DocumentStore} from '../src/modules/documents/store';
import {blankRule,calculateDeduction} from '../src/modules/income/calculation';
import { handleSync } from '../web-server/sync.mjs';

it('sincroniza dos dispositivos cifrados, detecta conflicto y conserva la elección confirmada', async () => {
  const rows = new Map<string, { bytes: Uint8Array; tag: string }>(); let version = 0;
  const BUCKET = { async get(key: string) { const r = rows.get(key); return r ? { body: new Blob([new Uint8Array(r.bytes)]).stream(), httpEtag: r.tag } : null; }, async put(key: string, bytes: Uint8Array, options: { onlyIf: Headers }) { const old = rows.get(key); if (options.onlyIf.get('If-None-Match') === '*' && old || options.onlyIf.has('If-Match') && old?.tag !== options.onlyIf.get('If-Match')) return null; const tag = `"${(++version).toString(16)}"`; rows.set(key, { bytes, tag }); return { httpEtag: tag }; } };
  vi.stubGlobal('fetch', async (path: string, init: RequestInit) => handleSync(new Request(new URL(path, 'https://edumoney.test'), init), { BUCKET }));
  vi.stubGlobal('isSecureContext', true); vi.stubGlobal('navigator', { locks: { request: async (_n: string, _o: unknown, f: (lock: object) => Promise<void>) => f({}) }, storage: { persist: async () => true } });
  async function device() { vi.resetModules(); const idb = new IDBFactory(); vi.stubGlobal('indexedDB', idb); const vault = await import('../src/web/vault'); await vault.unlockWebVault('Contraseña-FICTICIA-2026'); const sync = await import('../src/web/sync'); const { getMoneyStore } = await import('../src/modules/money/localStore'); return { idb, sync, store: await getMoneyStore() }; }
  const a = await device();expect(await a.sync.ensureAutomaticSync()).toBe(true);const code=(await a.sync.syncSettings())!.code;
  const entry = (id: string, kind: 'income' | 'expense', amount: number): LedgerMovement => ({ id, idempotencyKey: id, kind, amountCents: cents(amount), currency: 'USD', date: '2026-11-13', description: id, categoryId: null, paymentMethod: 'check', taxReview: false, useKind: 'personal', grossCents: null, withholdingCents: null, createdAt: '2026-11-13T00:00:00Z', updatedAt: '2026-11-13T00:00:00Z', deletedAt: null, incomeType: 'manual', scheduleId: null, occurrenceDate: null, version: 1 });
  await a.store.create(entry('Ingreso FICTICIO A', 'income', 10000));
  const rule={...blankRule(),mode:'percentage' as const,percentage:'8'};await new IncomeStore(a.store).saveCategory('custom-sync','Categoría FICTICIA sincronizada',rule);
  const calculation=calculateDeduction(rule,150000);
  await new DocumentStore(a.store,async s=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))),b=>b.toString(16).padStart(2,'0')).join('')).save({id:'cheque-sync',kind:'paid_income',source:'manual',description:'Pagador FICTICIO',date:'2026-11-13',amountCents:138000,notes:'',rawText:null,image:null,keepImage:false,movementId:null,billId:null,expectedMovementVersion:null,expectedBillVersion:null,categoryId:null,paymentMethod:'check',supersedesId:null,expectedDocumentVersion:null,confirmSimilar:false,reviewed:true,incomeStatement:{version:1,kind:'check',issuer:'Pagador FICTICIO',reference:'SYNC-FICTICIO',periodStart:null,periodEnd:null,grossCents:150000,netCents:138000,complete:true,deductions:[{id:'d',categoryId:'custom-sync',label:'Categoría FICTICIA sincronizada',amountCents:12000,calculation}]}});
  await a.sync.synchronize();
  expect(new TextDecoder().decode([...rows.values()][0].bytes)).not.toContain('Ingreso FICTICIO');
  const b = await device();await b.sync.ensureAutomaticSync();expect((await b.sync.syncSettings())!.code).not.toBe(code);await b.sync.connectCode(code); const first = await b.sync.synchronize(); expect(first.conflict).toBeTruthy();
  await expect(b.sync.resolveSync(first.conflict!, 'remote', 'NO')).rejects.toThrow('REEMPLAZAR');
  await b.sync.resolveSync(first.conflict!, 'remote', 'REEMPLAZAR'); expect((await b.store.snapshot()).movements).toHaveLength(2);const received=await new IncomeStore(b.store).snapshot();expect(received.categories.find(c=>c.id==='custom-sync')?.rule).toEqual(rule);expect(received.statements[0].statement.deductions[0].calculation).toEqual(calculation);
  await b.store.create(entry('Gasto FICTICIO B', 'expense', 2000)); await b.sync.synchronize();
  vi.stubGlobal('indexedDB', a.idb); const automatic=await a.sync.synchronize({uploadOnly:true});expect(automatic.conflict).toBeTruthy();expect((await a.store.snapshot()).movements).toHaveLength(2);expect((await a.sync.synchronize()).conflict).toBeUndefined(); expect((await a.store.snapshot()).movements).toHaveLength(3);
  await a.store.create(entry('Cambio FICTICIO A', 'expense', 1000)); await a.sync.synchronize();
  vi.stubGlobal('indexedDB', b.idb); await b.store.create(entry('Cambio FICTICIO B', 'income', 5000)); const conflict = await b.sync.synchronize(); expect(conflict.conflict).toBeTruthy();
  expect((await b.store.snapshot()).movements.some(m => m.description === 'Cambio FICTICIO B')).toBe(true);
  await b.sync.resolveSync(conflict.conflict!, 'local', 'REEMPLAZAR');
  vi.stubGlobal('indexedDB', a.idb); await a.sync.synchronize(); expect((await a.store.snapshot()).movements.some(m => m.description === 'Cambio FICTICIO B')).toBe(true);
  await a.sync.disconnectSync();expect(await a.sync.ensureAutomaticSync()).toBe(false);expect((await a.store.snapshot()).movements.some(m=>m.description==='Cambio FICTICIO B')).toBe(true);
  vi.unstubAllGlobals();
}, 45000);
