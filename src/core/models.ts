import type { Cents } from './money';
export type Id = string;
export type LocalDate = string; // YYYY-MM-DD; sin conversiones UTC para vencimientos.
export type MovementKind = 'income' | 'expense' | 'transfer' | 'loan' | 'debt_payment' | 'goal_contribution';
export type UseKind = 'personal' | 'business' | 'mixed' | 'unknown';
export interface Movement {
  id: Id; idempotencyKey: string; kind: MovementKind; amountCents: Cents;
  currency: 'USD'; date: LocalDate; description: string; categoryId: Id | null;
  paymentMethod: string | null; taxReview: boolean; useKind: UseKind;
  grossCents: Cents | null; withholdingCents: Cents | null;
  createdAt: string; updatedAt: string; deletedAt: string | null;
}
export interface Bill { id: Id; provider: string; amountCents: Cents; dueDate: LocalDate; recurrence: string | null }
export interface Debt { id: Id; name: string; balanceCents: Cents; annualRateBps: number | null; minimumCents: Cents | null; dueDate: LocalDate | null; closingDate: LocalDate | null; feesCents: Cents | null }
export interface Goal { id: Id; name: string; targetCents: Cents; desiredDate: LocalDate | null }
export interface Document { id: Id; movementId: Id | null; sha256: string; encryptedPath: string | null; supersedesId: Id | null; status: 'received' | 'pending' | 'corrected' | 'not_applicable' }
export interface TaxRecord { id: Id; movementId: Id | null; documentId: Id | null; taxYear: number; status: 'received' | 'pending' | 'corrected' | 'not_applicable'; notes: string | null }
export interface BillPayment { id: Id; billId: Id; movementId: Id; amountCents: Cents }
export interface DebtPayment { id: Id; debtId: Id; movementId: Id; principalCents: Cents | null; interestCents: Cents | null; feesCents: Cents | null }
export interface GoalContribution { id: Id; goalId: Id; movementId: Id; amountCents: Cents }
