import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';
import { migrate } from '../src/storage/migrate';
import { schemaV1 } from '../src/storage/schema';
import { userMessage, UserInputError } from '../src/core/errors';
import { cents } from '../src/core/money';
import { formatMoney, inputAmount, monthlySummary, nextOccurrence, validDate } from '../src/modules/money/domain';
import { DuplicateMovementError, MoneyStore, type SqlDb } from '../src/modules/money/store';
import type { IncomeSchedule, LedgerMovement } from '../src/modules/money/types';
function adapter(db: DatabaseSync): SqlDb {
    return {
        execAsync: async (sql) => { db.exec(sql); },
        runAsync: async (sql, ...params) => ({ changes: Number(db.prepare(sql).run(...params).changes) }),
        getAllAsync: async <T>(sql: string, ...params: (string | number | null)[]) => db.prepare(sql).all(...params) as T[],
        getFirstAsync: async <T>(sql: string, ...params: (string | number | null)[]) => db.prepare(sql).get(...params) as T ?? null,
    };
}
function entry(id: string, patch: Partial<LedgerMovement> = {}): LedgerMovement { return { id, idempotencyKey: `op-${id}`, kind: 'expense', amountCents: cents(1020), currency: 'USD', date: '2026-11-08', description: id, categoryId: 'expense-food', paymentMethod: 'bank', taxReview: false, useKind: 'unknown', grossCents: null, withholdingCents: null, createdAt: '2026-11-08T00:00:00Z', updatedAt: '2026-11-08T00:00:00Z', deletedAt: null, incomeType: 'manual', scheduleId: null, occurrenceDate: null, version: 1, ...patch }; }
async function setup() { const db = new DatabaseSync(':memory:'); await migrate(adapter(db)); return { db, store: new MoneyStore(adapter(db)) }; }
const schedule: IncomeSchedule = { id: 's1', description: 'Salario', amountCents: cents(10000), categoryId: 'income-salary', paymentMethod: 'bank', cadence: 'monthly', intervalCount: 1, anchorDate: '2026-01-31', nextDate: '2026-01-31', active: true };
describe('Etapa 3: libro local, SQLite real', () => {
    it('migra desde versión 1 sin perder movimientos y revierte una ampliación fallida', async () => {
        const db = new DatabaseSync(':memory:');
        db.exec(schemaV1);
        db.exec("PRAGMA user_version=1; INSERT INTO movements(id,idempotency_key,kind,amount_cents,date,description,created_at,updated_at) VALUES('old','old','expense',10,'2026-11-01','Anterior','a','a')");
        const real = adapter(db);
        await expect(migrate({ ...real, execAsync: async (sql) => { await real.execAsync(sql); if (sql.includes('CREATE TABLE monthly_budgets'))
                throw Error('interrupted'); } })).rejects.toThrow('interrupted');
        expect(db.prepare('PRAGMA user_version').get()).toMatchObject({ user_version: 1 });
        await migrate(real);
        expect((await new MoneyStore(real).snapshot()).movements[0]).toMatchObject({ id: 'old', amountCents: 10, version: 1, incomeType: 'manual' });
        db.close();
    });
    it('persiste movimientos, presupuestos y campos contributivos después de cerrar la conexión', async () => {
        const folder = mkdtempSync(join(tmpdir(), 'edumoney-ledger-'));
        let db = new DatabaseSync(join(folder, 'ledger.db'));
        try {
            await migrate(adapter(db));
            let store = new MoneyStore(adapter(db));
            await store.create(entry('net', { kind: 'income', categoryId: 'income-salary', grossCents: cents(2000), withholdingCents: cents(100), taxReview: true, useKind: 'mixed', incomeType: 'extraordinary' }));
            await store.saveBudget('2026-11', 'expense-food', 5000);
            db.close();
            db = new DatabaseSync(join(folder, 'ledger.db'));
            await migrate(adapter(db));
            store = new MoneyStore(adapter(db));
            const data = await store.snapshot();
            expect(data.movements[0]).toMatchObject({ grossCents: 2000, withholdingCents: 100, taxReview: true, useKind: 'mixed' });
            expect(data.budgets[0].amountCents).toBe(5000);
        }
        finally {
            db.close();
            rmSync(folder, { recursive: true, force: true });
        }
    });
    it('serializa doble pulsación/reintento, rechaza reutilización de token y pide revisión de posibles duplicados', async () => {
        const { db, store } = await setup();
        try {
            const m = entry('a');
            await Promise.all([store.create(m), store.create(m)]);
            expect((await store.snapshot()).movements).toHaveLength(1);
            await expect(store.create({ ...m, amountCents: cents(10) })).rejects.toThrow('identificador');
            await expect(store.create(entry('b', { description: 'a' }))).rejects.toBeInstanceOf(DuplicateMovementError);
            await store.create(entry('b', { description: 'a' }), true);
            expect((await store.snapshot()).movements).toHaveLength(2);
        }
        finally {
            db.close();
        }
    });
    it('edita con control de versión, elimina y restaura con auditoría, sin borrar identificadores', async () => {
        const { db, store } = await setup();
        try {
            await store.create(entry('a'));
            await store.edit(entry('a', { amountCents: cents(1010) }), 'Corrección de recibo');
            await expect(store.edit(entry('a'), 'Versión vieja')).rejects.toThrow('cambió');
            await expect(store.setDeleted('a', 2, true, '')).rejects.toThrow('motivo');
            await store.setDeleted('a', 2, true, 'Anulado');
            expect(monthlySummary(await store.snapshot(), '2026-11').expenses).toBe(0);
            await store.setDeleted('a', 3, false, 'Restauración');
            expect(monthlySummary(await store.snapshot(), '2026-11').expenses).toBe(1010);
            expect(await store.revisions('a')).toHaveLength(3);
            expect((await store.snapshot()).movements[0].idempotencyKey).toBe('op-a');
        }
        finally {
            db.close();
        }
    });
    it('protege movimientos enlazados y conserva las referencias', async () => {
        const { db, store } = await setup();
        try {
            await store.create(entry('a'));
            db.exec("INSERT INTO bills(id,provider,amount_cents,due_date,recurrence) VALUES('bill','Proveedor',1020,'2026-11-30',NULL);INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents) VALUES('pay','bill','a',1020)");
            await expect(store.edit(entry('a'), 'Editar')).rejects.toThrow('vinculado');
            await expect(store.setDeleted('a', 1, true, 'Eliminar')).rejects.toThrow('vinculado');
            expect((await store.snapshot()).commitments).toHaveLength(0);
        }
        finally {
            db.close();
        }
    });
    it('personaliza y archiva categorías sin perder historia; presupuesto cero y ausencia son distintos', async () => {
        const { db, store } = await setup();
        try {
            await store.saveCategory('custom', 'Mascotas', 'expense');
            await store.create(entry('a', { categoryId: 'custom' }));
            await store.saveBudget('2026-11', 'custom', 0);
            await store.saveCategory('custom', 'Veterinario', 'expense', true);
            const data = await store.snapshot();
            expect(monthlySummary(data, '2026-11').distribution.find(c => c.id === 'custom')).toMatchObject({ name: 'Veterinario', spent: 1020, budget: 0 });
            await expect(store.create(entry('b', { categoryId: 'custom' }))).rejects.toThrow('activa');
            await store.saveCategory('custom', 'Veterinario', 'expense');
            await store.saveBudget('2026-11', 'custom', null);
            expect((await store.snapshot()).budgets).toHaveLength(0);
            await expect(store.saveCategory('dup', ' comida ', 'expense')).rejects.toThrow('existe');
            await expect(store.saveBudget('2026-13', 'custom', 1)).rejects.toThrow();
            await expect(store.saveBudget('2026-11', 'income-salary', 1)).rejects.toThrow();
        }
        finally {
            db.close();
        }
    });
    it('no cuenta transferencias como ingresos ni compras de tarjeta por segunda vez al pagar; bruto no duplica neto', async () => {
        const { db, store } = await setup();
        try {
            await store.create(entry('income', { kind: 'income', categoryId: 'income-salary', amountCents: cents(100010), grossCents: cents(120000), withholdingCents: cents(1000) }));
            await store.create(entry('card', { paymentMethod: 'credit', amountCents: cents(2020) }));
            await store.create(entry('cash', { amountCents: cents(10) }));
            await store.create(entry('pay', { kind: 'debt_payment', categoryId: null, amountCents: cents(2020) }));
            await store.create(entry('own', { kind: 'transfer', categoryId: null, amountCents: cents(50000) }));
            await store.create(entry('loan', { kind: 'loan', categoryId: null, amountCents: cents(5000) }));
            db.exec("INSERT INTO bills(id,provider,amount_cents,due_date,recurrence) VALUES('bill','Proveedor',10000,'2026-11-30',NULL)");
            const total = monthlySummary(await store.snapshot(), '2026-11');
            expect(total).toMatchObject({ income: 100010, expenses: 2030, loans: 5000, payments: 2020, cashFlow: 102980, commitments: 10000, available: 92980 });
            expect(monthlySummary(await store.snapshot(), '2026-12').income).toBe(0);
        }
        finally {
            db.close();
        }
    });
    it('recurrencia mensual: primer cobro real, siguientes pendientes, confirmación única y reversión ante errores', async () => {
        const { db, store } = await setup();
        try {
            await expect(store.create(entry('r', { kind: 'income', categoryId: 'income-salary', scheduleId: 's1', incomeType: 'recurring', date: '2026-01-31', occurrenceDate: '2026-01-31', description: 'NO' }), false, schedule)).rejects.toThrow('corresponde');
            expect((await store.snapshot()).schedules).toHaveLength(0);
            const first = entry('r', { kind: 'income', amountCents: cents(10000), categoryId: 'income-salary', scheduleId: 's1', incomeType: 'recurring', date: '2026-01-31', occurrenceDate: '2026-01-31', description: 'Salario' });
            await store.create(first, false, schedule);
            let data = await store.snapshot();
            expect(data.schedules[0].nextDate).toBe('2026-02-28');
            expect(monthlySummary(data, '2026-02').income).toBe(0);
            await expect(store.confirmSchedule('s1', '2026-02-28', 'next', '2026-02-01')).rejects.toThrow('fecha');
            await Promise.all([store.confirmSchedule('s1', '2026-02-28', 'next', '2026-03-01'), store.confirmSchedule('s1', '2026-02-28', 'retry', '2026-03-01')]);
            data = await store.snapshot();
            expect(data.movements).toHaveLength(2);
            expect(data.schedules[0].nextDate).toBe('2026-03-31');
            await store.setDeleted('next', 1, true, 'Error');
            await store.confirmSchedule('s1', '2026-02-28', 'again', '2026-03-01');
            expect((await store.snapshot()).movements).toHaveLength(2);
            await store.toggleSchedule('s1', false);
            await expect(store.confirmSchedule('s1', '2026-03-31', 'paused', '2026-04-01')).rejects.toThrow();
        }
        finally {
            db.close();
        }
    });
    it('valida importes, clasificaciones y fechas antes de escribir', async () => {
        const { db, store } = await setup();
        try {
            for (const patch of [{ date: '2026-02-30' }, { amountCents: cents(-1) }, { kind: 'loan' as const, paymentMethod: 'credit' }, { kind: 'expense' as const, grossCents: cents(1) }, { categoryId: 'income-salary' }, { kind: 'income' as const, categoryId: null, grossCents: cents(1), withholdingCents: cents(2) }])
                await expect(store.create(entry('invalid', patch))).rejects.toThrow();
            expect((await store.snapshot()).movements).toHaveLength(0);
        }
        finally {
            db.close();
        }
    });
});
describe('Fechas y presentación decimal', () => {
    it('conserva exactamente el máximo monetario admitido al mostrar y editar', () => { expect(formatMoney(Number.MAX_SAFE_INTEGER)).toBe('$90,071,992,547,409.91'); expect(inputAmount(Number.MAX_SAFE_INTEGER)).toBe('90071992547409.91'); });
    it('respeta años bisiestos, intervalos y anclaje mensual', () => { expect(validDate('2028-02-29')).toBe(true); expect(validDate('2026-02-29')).toBe(false); expect(nextOccurrence({ ...schedule, anchorDate: '2028-01-31', nextDate: '2028-01-31' })).toBe('2028-02-29'); expect(nextOccurrence({ ...schedule, nextDate: '2026-02-28' })).toBe('2026-03-31'); expect(nextOccurrence({ ...schedule, cadence: 'weekly', intervalCount: 2 })).toBe('2026-02-14'); });
});

it('no presenta errores internos de SQLite ni detalles sensibles en pantalla',()=>{expect(userMessage(new Error('SQLITE_PRIVATE_PATH_AND_QUERY'))).not.toContain('SQLITE');expect(userMessage(new UserInputError('Revisa el importe'))).toBe('Revisa el importe');});

it('parametriza nombres y descripciones sin interpretar SQL del usuario',async()=>{
 const {db,store}=await setup();try{const text="Comida'); DROP TABLE movements; --";await store.saveCategory('quoted',text,'expense');await store.create(entry('quoted-entry',{description:text,categoryId:'quoted'}));expect((await store.snapshot()).movements[0].description).toBe(text);expect(db.prepare('SELECT count(*) AS n FROM movements').get()).toMatchObject({n:1});}finally{db.close();}
});
it('resta solo la parte pendiente de una factura vinculada a un pago existente',async()=>{
 const {db,store}=await setup();try{await store.create(entry('income',{kind:'income',categoryId:null,amountCents:cents(10000)}));await store.create(entry('payment',{amountCents:cents(4000)}));db.exec("INSERT INTO bills(id,provider,amount_cents,due_date,recurrence) VALUES('bill','Proveedor',10000,'2026-11-30',NULL); INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents) VALUES('part','bill','payment',4000)");const summary=monthlySummary(await store.snapshot(),'2026-11');expect(summary.commitments).toBe(6000);expect(summary.available).toBe(0);}finally{db.close();}
});
