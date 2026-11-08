import type { Cents } from '../../core/money';
import type { Category, LedgerMovement, PaymentMethod } from '../money/types';
export type Cadence = 'weekly' | 'monthly' | 'days';
export interface BillInput {
 id: string; provider: string; amountCents: Cents; dueDate: string;
 categoryId: string | null; paymentKind: 'expense' | 'debt_payment'; reminderDays: number | null;
}
export interface Bill extends BillInput {
 seriesId: string | null; occurrenceDate: string | null; version: number;
 createdAt: string | null; updatedAt: string | null; voidedAt: string | null; paidCents: Cents;
 /** Plantillas antiguas se conservan sin interpretar texto desconocido. */
 legacyRecurrence: string | null;
}
export interface BillSeries {
 id: string; provider: string; amountCents: Cents; categoryId: string | null;
 paymentKind: 'expense' | 'debt_payment'; cadence: Cadence; intervalCount: number;
 anchorDate: string; nextDate: string; endDate: string | null; reminderDays: number | null; active: boolean;
}
export interface RecurrenceInput { id: string; cadence: Cadence; intervalCount: number; endDate: string | null }
export interface BillPayment {
 id: string; billId: string; movementId: string; amountCents: Cents; date: string; paymentMethod: PaymentMethod;
 createdMovement: boolean; reversed: boolean; reason: string | null;
}
export interface BillSnapshot { bills: Bill[]; series: BillSeries[]; payments: BillPayment[]; categories: Category[]; movements: LedgerMovement[] }
export interface PaymentInput {
 id: string; billId: string; expectedVersion: number; amountCents: Cents; date: string; paymentMethod: PaymentMethod;
 /** Si existe, solo se vincula; no se inserta un nuevo movimiento. */
 existingMovementId: string | null; confirmSimilar: boolean;
}
