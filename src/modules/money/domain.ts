import { UserInputError } from '../../core/errors';
import { addAmounts, cents } from '../../core/money';
import type { LedgerMovement, Snapshot, IncomeSchedule } from './types';
export function validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > '9999-12-31')
        return false;
    const date = new Date(`${value}T12:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validMonth(value: string): boolean { return /^\d{4}-\d{2}$/.test(value) && validDate(`${value}-01`); }
export function localToday(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function inputAmount(value: number): string {
    cents(value);
    const n = BigInt(value);
    const abs = n < 0n ? -n : n;
    return `${n < 0n ? '-' : ''}${abs / 100n}.${String(abs % 100n).padStart(2, '0')}`;
}
export function formatMoney(value: number): string {
    cents(value);
    const n = BigInt(value);
    const abs = n < 0n ? -n : n;
    return `${n < 0n ? '−' : ''}$${(abs / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${(abs % 100n).toString().padStart(2, '0')}`;
}
export function validateMovement(m: LedgerMovement) {
    if (!m.id || !m.idempotencyKey || !m.description.trim() || m.description.length > 240 || !validDate(m.date))
        throw new UserInputError('Revisa la descripción y la fecha (AAAA-MM-DD).');
    if (cents(m.amountCents) <= 0 || m.currency !== 'USD')
        throw new UserInputError('El importe debe ser positivo y en dólares.');
    if (!['income', 'expense', 'transfer', 'loan', 'debt_payment'].includes(m.kind))
        throw new UserInputError('Tipo de movimiento no disponible en esta etapa.');
    if (!['manual', 'recurring', 'extraordinary'].includes(m.incomeType) || !['personal', 'business', 'mixed', 'unknown'].includes(m.useKind))
        throw new UserInputError('Clasificación no válida.');
    if (!['cash', 'check', 'debit', 'credit', 'bank', 'other'].includes(m.paymentMethod || ''))
        throw new UserInputError('Selecciona un método de pago.');
    if (m.kind !== 'expense' && m.paymentMethod === 'credit')
        throw new UserInputError('El crédito como método corresponde a una compra, no a un cobro o pago de deuda.');
    if (m.kind !== 'income' && (m.incomeType !== 'manual' || m.scheduleId || m.grossCents !== null || m.withholdingCents !== null))
        throw new UserInputError('Los datos salariales y recurrentes corresponden a ingresos.');
    for (const value of [m.grossCents, m.withholdingCents])
        if (value !== null && cents(value) < 0)
            throw new UserInputError('Bruto y retención no pueden ser negativos.');
    if (m.grossCents !== null && m.withholdingCents !== null && m.withholdingCents > m.grossCents)
        throw new UserInputError('La retención no puede superar el ingreso bruto.');
    if ((m.incomeType === 'recurring') !== Boolean(m.scheduleId) || Boolean(m.scheduleId) !== Boolean(m.occurrenceDate))
        throw new UserInputError('La recurrencia necesita una programación y su fecha de origen.');
    if (m.occurrenceDate !== null && !validDate(m.occurrenceDate))
        throw new UserInputError('Fecha de recurrencia no válida.');
}
/** Se calcula desde el día original: enero 31 → febrero 28 → marzo 31. */
export function nextOccurrence(s: IncomeSchedule): string {
    if (!['weekly', 'monthly'].includes(s.cadence) || !validDate(s.anchorDate) || !validDate(s.nextDate) || !Number.isInteger(s.intervalCount) || s.intervalCount < 1 || s.intervalCount > 120)
        throw new UserInputError('Recurrencia no válida.');
    const d = new Date(`${s.nextDate}T12:00:00Z`);
    if (s.cadence === 'weekly')
        d.setUTCDate(d.getUTCDate() + 7 * s.intervalCount);
    else {
        const day = Number(s.anchorDate.slice(8));
        const month = d.getUTCMonth() + s.intervalCount;
        d.setUTCDate(1);
        d.setUTCMonth(month);
        const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
        d.setUTCDate(Math.min(day, last));
    }
    const result = d.toISOString().slice(0, 10);
    if (!validDate(result))
        throw new UserInputError('La próxima fecha queda fuera del rango admitido.');
    return result;
}
export function possibleDuplicates(m: LedgerMovement, movements: LedgerMovement[]) {
    return movements.filter(x => !x.deletedAt && x.id !== m.id && x.kind === m.kind && x.date === m.date && x.amountCents === m.amountCents && x.description.trim().toLocaleLowerCase('es') === m.description.trim().toLocaleLowerCase('es'));
}
export function monthlySummary(snapshot: Snapshot, month: string) {
    if (!validMonth(month))
        throw new UserInputError('Mes no válido.');
    const rows = snapshot.movements.filter(m => !m.deletedAt && m.date.startsWith(month));
    const total = (predicate: (m: LedgerMovement) => boolean) => addAmounts(...rows.filter(predicate).map(m => m.amountCents));
    const income = total(m => m.kind === 'income');
    const expenses = total(m => m.kind === 'expense');
    const loans = total(m => m.kind === 'loan');
    const payments = total(m => m.kind === 'debt_payment');
    const cashExpenses = total(m => m.kind === 'expense' && m.paymentMethod !== 'credit');
    const contributions = total(m => m.kind === 'goal_contribution');
    const commitments = addAmounts(...snapshot.commitments.filter(b => b.dueDate.startsWith(month)).map(b => b.outstandingCents));
    const cashFlow = addAmounts(income, loans, cents(-cashExpenses), cents(-payments), cents(-contributions));
    const distribution = snapshot.categories.filter(c => c.kind === 'expense').map(c => ({ ...c, spent: total(m => m.kind === 'expense' && m.categoryId === c.id), budget: snapshot.budgets.find(b => b.month === month && b.categoryId === c.id)?.amountCents ?? null }));
    const uncategorized = total(m => m.kind === 'expense' && !m.categoryId);
    if (uncategorized)
        distribution.push({ id: 'uncategorized', name: 'Sin categoría', kind: 'expense', archived: false, spent: uncategorized, budget: null });
    return { income, expenses, loans, payments, contributions, commitments, cashFlow, available: addAmounts(cashFlow, cents(-commitments)), distribution };
}
