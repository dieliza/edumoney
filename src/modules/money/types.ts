import type { Movement, MovementKind } from '../../core/models';
import type { Cents } from '../../core/money';
export type IncomeType = 'manual' | 'recurring' | 'extraordinary';
export type PaymentMethod = 'cash' | 'check' | 'debit' | 'credit' | 'bank' | 'other';
export interface LedgerMovement extends Movement {
    incomeType: IncomeType;
    scheduleId: string | null;
    occurrenceDate: string | null;
    version: number;
}
export interface Category {
    id: string;
    name: string;
    kind: 'income' | 'expense';
    archived: boolean;
}
export interface Budget {
    month: string;
    categoryId: string;
    amountCents: Cents;
}
export interface IncomeSchedule {
    id: string;
    description: string;
    amountCents: Cents;
    categoryId: string | null;
    paymentMethod: string | null;
    cadence: 'weekly' | 'monthly';
    intervalCount: number;
    anchorDate: string;
    nextDate: string;
    active: boolean;
}
export interface Snapshot {
    movements: LedgerMovement[];
    categories: Category[];
    budgets: Budget[];
    schedules: IncomeSchedule[];
    commitments: {
        id: string;
        dueDate: string;
        outstandingCents: Cents;
    }[];
}
export type EntryKind = Exclude<MovementKind, 'goal_contribution'>;
export const kindLabels: Record<EntryKind, string> = { income: 'Ingreso', expense: 'Gasto', transfer: 'Transferencia propia', loan: 'Préstamo recibido', debt_payment: 'Pago de tarjeta o deuda' };
export const paymentLabels: Record<PaymentMethod, string> = { cash: 'Efectivo', check: 'Cheque', debit: 'Tarjeta de débito', credit: 'Tarjeta de crédito', bank: 'Transferencia bancaria', other: 'Otro' };
