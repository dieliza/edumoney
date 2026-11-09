import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { migrate, type MigrationDb } from '../src/storage/migrate';
import { schemaV1 } from '../src/storage/schema';
import { MovementRepository } from '../src/modules/money/repository';
import { cents } from '../src/core/money';
import type { Movement } from '../src/core/models';
const adapter = (db: DatabaseSync): MigrationDb => ({
  execAsync: async sql => { db.exec(sql); },
  getFirstAsync: async <T>(sql: string) => db.prepare(sql).get() as T | null,
});
const movement = (id = 'm1'): Movement => ({
  id, idempotencyKey: 'operation-1', kind: 'expense', amountCents: cents(1234), currency: 'USD',
  date: '2026-11-08', description: 'Prueba', categoryId: null, paymentMethod: null,
  taxReview: false, useKind: 'unknown', grossCents: null, withholdingCents: null,
  createdAt: '2026-11-08T00:00:00Z', updatedAt: '2026-11-08T00:00:00Z', deletedAt: null,
});
function repository(db: DatabaseSync) {
  return new MovementRepository({ runAsync: async (sql: string, ...params: any[]) => {
    const r = db.prepare(sql).run(...params);
    return { changes: Number(r.changes), lastInsertRowId: Number(r.lastInsertRowid) };
  } } as ConstructorParameters<typeof MovementRepository>[0]);
}
describe('SQLite real (sin cifrado, solo pruebas de esquema)', () => {
  it('migra y reabre datos persistentes sin duplicar tablas', async () => {
    const folder = mkdtempSync(join(tmpdir(), 'edumoney-'));
    let db = new DatabaseSync(join(folder, 'test.db'));
    try {
      await migrate(adapter(db)); await repository(db).create(movement()); db.close();
      db = new DatabaseSync(join(folder, 'test.db')); await migrate(adapter(db));
      expect(db.prepare('SELECT amount_cents, gross_cents FROM movements').get()).toMatchObject({ amount_cents: 1234, gross_cents: null });
      expect(db.prepare('PRAGMA foreign_keys').get()).toMatchObject({ foreign_keys: 1 });
    } finally { db.close(); rmSync(folder, { recursive: true, force: true }); }
  });
  it('rechaza duplicados, referencias inexistentes e importes fraccionarios', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await migrate(adapter(db)); const repo = repository(db); await repo.create(movement());
      await expect(repo.create(movement('m2'))).rejects.toThrow();
      await expect(repo.create({ ...movement('m3'), idempotencyKey: 'op3', categoryId: 'missing' })).rejects.toThrow();
      expect(() => db.exec("UPDATE movements SET amount_cents=1.5")).toThrow();
      db.exec("INSERT INTO bills(id,provider,amount_cents,due_date,recurrence) VALUES ('b1','Proveedor',1234,'2026-12-01',NULL)");
      db.exec("INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents) VALUES ('p1','b1','m1',1234)");
      expect(() => db.exec("INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents) VALUES ('p2','b1','m1',1234)")).toThrow();
      expect(() => db.exec("DELETE FROM movements WHERE id='m1'")).toThrow();
      db.exec("INSERT INTO documents(id,movement_id,sha256,encrypted_path,supersedes_id,status) VALUES ('d1','m1','hash',NULL,NULL,'received')");
      expect(() => db.exec("INSERT INTO documents(id,movement_id,sha256,encrypted_path,supersedes_id,status) VALUES ('d2',NULL,'hash',NULL,NULL,'received')")).toThrow();
    } finally { db.close(); }
  });
  it('revierte completamente una migración fallida y rechaza versiones futuras', async () => {
    const db = new DatabaseSync(':memory:'); const real = adapter(db);
    try {
      const failing: MigrationDb = { ...real, execAsync: async sql => { await real.execAsync(sql); if (sql === schemaV1) throw new Error('interrupted'); } };
      await expect(migrate(failing)).rejects.toThrow('interrupted');
      expect(db.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 0 });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all()).toHaveLength(0);
      db.exec('PRAGMA user_version=13'); await expect(migrate(real)).rejects.toThrow('compatible');
    } finally { db.close(); }
  });
  it('valida fechas e importes antes de guardar', async () => {
    const db = new DatabaseSync(':memory:');
    try {
      await migrate(adapter(db)); const repo = repository(db);
      await expect(repo.create({ ...movement(), date: '2026-02-30' })).rejects.toThrow();
      await expect(repo.create({ ...movement(), amountCents: cents(0) })).rejects.toThrow();
      expect(db.prepare('SELECT * FROM movements').all()).toHaveLength(0);
    } finally { db.close(); }
  });
});
