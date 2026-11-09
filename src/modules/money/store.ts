import { UserInputError } from '../../core/errors';
import type { Movement } from '../../core/models';
import { MovementRepository } from './repository';
import { cents } from '../../core/money';
import { nextOccurrence, possibleDuplicates, validDate, validMonth, validateMovement } from './domain';
import type { Budget, Category, IncomeSchedule, LedgerMovement, Snapshot } from './types';
export interface SqlDb {
    execAsync(sql: string): Promise<void>;
    runAsync(sql: string, ...params: (string | number | null)[]): Promise<{
        changes: number;
    }>;
    getAllAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T[]>;
    getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null>;
}
export class DuplicateMovementError extends UserInputError {
    constructor() { super('Ya hay un movimiento con la misma fecha, descripción e importe. Revisa el historial antes de guardar otro.'); }
}
export const movementSelect = `SELECT id,idempotency_key AS idempotencyKey,kind,amount_cents AS amountCents,currency,date,description,
 category_id AS categoryId,payment_method AS paymentMethod,tax_review AS taxReview,use_kind AS useKind,gross_cents AS grossCents,
 withholding_cents AS withholdingCents,created_at AS createdAt,updated_at AS updatedAt,deleted_at AS deletedAt,
 income_type AS incomeType,schedule_id AS scheduleId,occurrence_date AS occurrenceDate,version FROM movements`;
const scheduleSelect = `SELECT id,description,amount_cents AS amountCents,category_id AS categoryId,payment_method AS paymentMethod,
 cadence,interval_count AS intervalCount,anchor_date AS anchorDate,next_date AS nextDate,active FROM income_schedules`;
export const readMovement = (m: LedgerMovement): LedgerMovement => ({ ...m, taxReview: !!m.taxReview });
const canonical = (m: LedgerMovement) => JSON.stringify([m.kind, m.amountCents, m.date, m.description, m.categoryId, m.paymentMethod, m.taxReview, m.useKind, m.grossCents, m.withholdingCents, m.incomeType, m.scheduleId, m.occurrenceDate]);
/** Una sola instancia serializa lecturas y escrituras de esta conexión cifrada. */
export class MoneyStore {
    private queue: Promise<unknown> = Promise.resolve();
    constructor(private db: SqlDb) { }
    private serialized<T>(task: () => Promise<T>): Promise<T> { const next = this.queue.then(task); this.queue = next.catch(() => undefined); return next; }
    private write<T>(task: () => Promise<T>): Promise<T> {
        return this.serialized(async () => {
            await this.db.execAsync('BEGIN IMMEDIATE;');
            try {
                const result = await task();
                await this.db.execAsync('COMMIT;');
                return result;
            }
            catch (e) {
                await this.db.execAsync('ROLLBACK;');
                throw e;
            }
        });
    }
    /** Los módulos comparten esta cola y conexión: no abrir transacciones anidadas ni conexiones sin clave. */
    read<T>(task: (db: SqlDb) => Promise<T>): Promise<T> { return this.serialized(() => task(this.db)); }
    transaction<T>(task: (db: SqlDb) => Promise<T>): Promise<T> { return this.write(() => task(this.db)); }
    private async movements() { return (await this.db.getAllAsync<LedgerMovement>(movementSelect + ' ORDER BY date DESC, created_at DESC')).map(readMovement); }
    async snapshot(): Promise<Snapshot> {
        return this.serialized(async () => ({
            movements: await this.movements(),
            categories: (await this.db.getAllAsync<Category>('SELECT id,name,kind,archived FROM categories ORDER BY kind,name')).map(c => ({ ...c, archived: !!c.archived })),
            budgets: await this.db.getAllAsync<Budget>('SELECT month,category_id AS categoryId,amount_cents AS amountCents FROM monthly_budgets'),
            schedules: (await this.db.getAllAsync<IncomeSchedule>(scheduleSelect + ' ORDER BY next_date')).map(s => ({ ...s, active: !!s.active })),
            commitments: await this.db.getAllAsync(`SELECT b.id,b.due_date AS dueDate,MAX(0,b.amount_cents-COALESCE(SUM(p.amount_cents),0)) AS outstandingCents
    FROM bills b LEFT JOIN bill_payments p ON p.bill_id=b.id AND NOT EXISTS(SELECT 1 FROM bill_payment_reversals r WHERE r.payment_id=p.id) WHERE b.voided_at IS NULL GROUP BY b.id HAVING outstandingCents>0`),
        }));
    }
    private async validateCategory(m: LedgerMovement) {
        if (!m.categoryId)
            return;
        const category = await this.db.getFirstAsync<Category>('SELECT id,name,kind,archived FROM categories WHERE id=?', m.categoryId);
        if (!category || !['income', 'expense'].includes(m.kind) || category.kind !== m.kind)
            throw new UserInputError('La categoría no corresponde al movimiento.');
        // Una categoría archivada conserva su historia; no se permite en movimientos nuevos.
        if (category.archived) {
            const old = await this.db.getFirstAsync<{
                categoryId: string;
            }>('SELECT category_id AS categoryId FROM movements WHERE id=?', m.id);
            if (old?.categoryId !== m.categoryId)
                throw new UserInputError('Selecciona una categoría activa.');
        }
    }
    private async insert(m: LedgerMovement) {
        await new MovementRepository(this.db).create(m as Movement);
        await this.db.runAsync('UPDATE movements SET income_type=?,schedule_id=?,occurrence_date=? WHERE id=?', m.incomeType, m.scheduleId, m.occurrenceDate, m.id);
    }
    async create(m: LedgerMovement, allowDuplicate = false, schedule?: IncomeSchedule): Promise<void> {
        validateMovement(m);
        return this.write(async () => {
            const previous = await this.db.getFirstAsync<LedgerMovement>(movementSelect + ' WHERE idempotency_key=?', m.idempotencyKey);
            if (previous) {
                if (canonical(readMovement(previous)) === canonical(m))
                    return;
                throw new UserInputError('Este identificador ya pertenece a otra operación.');
            }
            if (!allowDuplicate && possibleDuplicates(m, await this.movements()).length)
                throw new DuplicateMovementError();
            await this.validateCategory(m);
            if (schedule) {
                if (m.kind !== 'income' || m.incomeType !== 'recurring' || m.scheduleId !== schedule.id || m.occurrenceDate !== m.date || schedule.nextDate !== m.date || schedule.anchorDate !== m.date || schedule.amountCents !== m.amountCents || schedule.description !== m.description || schedule.categoryId !== m.categoryId || schedule.paymentMethod !== m.paymentMethod)
                    throw new UserInputError('La recurrencia no corresponde al ingreso.');
                const next = nextOccurrence(schedule);
                await this.db.runAsync(`INSERT INTO income_schedules(id,description,amount_cents,category_id,payment_method,cadence,interval_count,anchor_date,next_date) VALUES(?,?,?,?,?,?,?,?,?)`, schedule.id, schedule.description, schedule.amountCents, schedule.categoryId, schedule.paymentMethod, schedule.cadence, schedule.intervalCount, schedule.anchorDate, next);
            }
            else if (m.scheduleId || m.incomeType === 'recurring')
                throw new UserInputError('Confirma los ingresos recurrentes desde su fecha prevista.');
            await this.insert(m);
        });
    }
    private async existing(id: string, version: number) {
        const m = await this.db.getFirstAsync<LedgerMovement>(movementSelect + ' WHERE id=?', id);
        if (!m || m.version !== version)
            throw new UserInputError('El movimiento cambió. Cierra esta ficha y vuelve a abrirla.');
        return readMovement(m);
    }
    private async guardLinks(id: string, allowDocuments = false) {
        const linked = await this.db.getFirstAsync<{
            n: number;
        }>(`SELECT (
    (SELECT COUNT(*) FROM bill_payments WHERE movement_id=?)+(SELECT COUNT(*) FROM debt_payments WHERE movement_id=?)+
    (SELECT COUNT(*) FROM goal_contributions WHERE movement_id=?)+(SELECT COUNT(*) FROM documents WHERE movement_id=? AND ?=0)+
    (SELECT COUNT(*) FROM tax_records WHERE movement_id=?)) AS n`, id, id, id, id, Number(allowDocuments), id);
        if (linked?.n)
            throw new UserInputError('Este movimiento está vinculado a otra sección. Debe corregirse junto con su registro de origen.');
    }
    private async revision(m: LedgerMovement, action: string, reason: string) {
        if (!reason.trim() || reason.length > 240)
            throw new UserInputError('Escribe el motivo de la corrección (hasta 240 caracteres).');
        await this.db.runAsync('INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)', m.id, action, reason.trim(), JSON.stringify(m), new Date().toISOString());
    }
    async edit(m: LedgerMovement, reason: string, allowDuplicate = false, documentReview?: { id: string; version: number }) {
        validateMovement(m);
        return this.write(async () => {
            const old = await this.existing(m.id, m.version);
            if (old.deletedAt)
                throw new UserInputError('Restaura el movimiento antes de editarlo.');
            if (old.idempotencyKey !== m.idempotencyKey || old.scheduleId !== m.scheduleId || old.occurrenceDate !== m.occurrenceDate || old.incomeType === 'recurring' && m.incomeType !== 'recurring')
                throw new UserInputError('No se pueden cambiar los vínculos de recurrencia.');
            if (old.scheduleId && m.kind !== 'income')
                throw new UserInputError('Un cobro recurrente debe conservar el tipo ingreso.');
            if (documentReview) {
                const doc = await this.db.getFirstAsync<{ version: number; status: string; deleted: string | null }>('SELECT version,status,deleted_at AS deleted FROM documents WHERE id=? AND movement_id=?', documentReview.id, m.id);
                if (!doc || doc.deleted || doc.status === 'corrected' || doc.version !== documentReview.version) throw new UserInputError('El comprobante cambió; abre su ficha actual antes de corregir.');
            }
            await this.guardLinks(m.id, !!documentReview);
            await this.validateCategory(m);
            if (!allowDuplicate && possibleDuplicates(m, await this.movements()).length)
                throw new DuplicateMovementError();
            await this.revision(old, 'edit', reason);
            await this.db.runAsync(`UPDATE movements SET kind=?,amount_cents=?,date=?,description=?,category_id=?,payment_method=?,tax_review=?,use_kind=?,gross_cents=?,withholding_cents=?,income_type=?,updated_at=?,version=version+1 WHERE id=?`, m.kind, m.amountCents, m.date, m.description.trim(), m.categoryId, m.paymentMethod, Number(m.taxReview), m.useKind, m.grossCents, m.withholdingCents, m.incomeType, new Date().toISOString(), m.id);
            if (documentReview) {
                const docs = await this.db.getAllAsync<{ id: string }>("SELECT * FROM documents WHERE movement_id=? AND status<>'corrected' AND deleted_at IS NULL", m.id);
                for (const doc of docs) {
                    await this.db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)', doc.id, 'Movimiento corregido: ' + reason.trim(), JSON.stringify(doc), new Date().toISOString());
                    await this.db.runAsync("UPDATE documents SET status='pending',version=version+1 WHERE id=?", doc.id);
                }
            }
        });
    }
    async setDeleted(id: string, version: number, deleted: boolean, reason: string, documentReview?: { id: string; version: number }) {
        return this.write(async () => {
            const old = await this.existing(id, version);
            if (!!old.deletedAt === deleted)
                return;
            if (documentReview) {
                const doc = await this.db.getFirstAsync<{ version: number; status: string; removed: string | null }>('SELECT version,status,deleted_at AS removed FROM documents WHERE id=? AND movement_id=?', documentReview.id, id);
                if (!doc || doc.removed || doc.status === 'corrected' || doc.version !== documentReview.version) throw new UserInputError('Abre el comprobante vigente antes de retirar o restaurar el movimiento.');
            }
            await this.guardLinks(id, !!documentReview);
            await this.revision(old, deleted ? 'delete' : 'restore', reason);
            const now = new Date().toISOString();
            await this.db.runAsync('UPDATE movements SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?', deleted ? now : null, now, id);
            if (documentReview) {
                const docs = await this.db.getAllAsync<{ id: string }>("SELECT * FROM documents WHERE movement_id=? AND status<>'corrected' AND deleted_at IS NULL", id);
                for (const doc of docs) {
                    await this.db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)', doc.id, (deleted ? 'Movimiento retirado: ' : 'Movimiento restaurado: ') + reason.trim(), JSON.stringify(doc), now);
                    await this.db.runAsync("UPDATE documents SET status='pending',version=version+1 WHERE id=?", doc.id);
                }
            }
        });
    }
    async saveCategory(id: string, name: string, kind: 'income' | 'expense', archived = false) {
        return this.write(async () => {
            name = name.trim();
            if (!name || name.length > 60)
                throw new UserInputError('La categoría necesita un nombre de hasta 60 caracteres.');
            const old = await this.db.getFirstAsync<Category>('SELECT id,name,kind FROM categories WHERE id=?', id);
            if (old && old.kind !== kind)
                throw new UserInputError('La categoría debe conservar su tipo.');
            const duplicate = await this.db.getFirstAsync<Category>('SELECT id FROM categories WHERE lower(trim(name))=lower(?) AND kind=? AND id<>?', name, kind, id);
            if (duplicate)
                throw new UserInputError('Ya existe una categoría con ese nombre.');
            await this.db.runAsync('INSERT INTO categories(id,name,kind,archived) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,archived=excluded.archived', id, name, kind, Number(archived));
        });
    }
    async saveBudget(month: string, categoryId: string, amount: number | null) {
        return this.write(async () => {
            if (!validMonth(month))
                throw new UserInputError('Usa un mes AAAA-MM.');
            const category = await this.db.getFirstAsync<Category>('SELECT kind,archived FROM categories WHERE id=?', categoryId);
            if (!category || category.kind !== 'expense' || category.archived)
                throw new UserInputError('Selecciona una categoría de gasto activa.');
            if (amount === null) {
                await this.db.runAsync('DELETE FROM monthly_budgets WHERE month=? AND category_id=?', month, categoryId);
                return;
            }
            if (cents(amount) < 0)
                throw new UserInputError('El presupuesto no puede ser negativo.');
            await this.db.runAsync('INSERT INTO monthly_budgets(month,category_id,amount_cents) VALUES(?,?,?) ON CONFLICT(month,category_id) DO UPDATE SET amount_cents=excluded.amount_cents', month, categoryId, amount);
        });
    }
    async toggleSchedule(id: string, active: boolean) { return this.write(async () => { await this.db.runAsync('UPDATE income_schedules SET active=? WHERE id=?', Number(active), id); }); }
    async confirmSchedule(scheduleId: string, expectedDate: string, id: string, today: string) {
        return this.write(async () => {
            if (!validDate(today) || !validDate(expectedDate))
                throw new UserInputError('Fecha no válida.');
            const s = await this.db.getFirstAsync<IncomeSchedule>(scheduleSelect + ' WHERE id=?', scheduleId);
            const prior = await this.db.getFirstAsync<{
                id: string;
            }>('SELECT id FROM movements WHERE schedule_id=? AND occurrence_date=?', scheduleId, expectedDate);
            if (prior)
                return;
            if (!s || !s.active || s.nextDate !== expectedDate || expectedDate > today)
                throw new UserInputError('Revisa la fecha prevista antes de confirmar el cobro.');
            const now = new Date().toISOString();
            const m: LedgerMovement = { id, idempotencyKey: `income:${scheduleId}:${expectedDate}`, kind: 'income', amountCents: s.amountCents, currency: 'USD', date: expectedDate, description: s.description, categoryId: s.categoryId, paymentMethod: s.paymentMethod, taxReview: false, useKind: 'unknown', grossCents: null, withholdingCents: null, createdAt: now, updatedAt: now, deletedAt: null, incomeType: 'recurring', scheduleId, occurrenceDate: expectedDate, version: 1 };
            validateMovement(m);
            await this.validateCategory(m);
            await this.insert(m);
            await this.db.runAsync('UPDATE income_schedules SET next_date=? WHERE id=?', nextOccurrence(s), scheduleId);
        });
    }
    async revisions(id: string) { return this.serialized(() => this.db.getAllAsync<{
        action: string;
        reason: string;
        recordedAt: string;
    }>('SELECT action,reason,recorded_at AS recordedAt FROM movement_revisions WHERE movement_id=? ORDER BY id DESC', id)); }
}
