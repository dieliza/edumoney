import type { Cents } from '../../core/money';
import type { Bill } from '../bills/types';
import type { LedgerMovement, PaymentMethod } from '../money/types';
export type DebtKind = 'credit_card'|'personal_loan'|'auto_loan'|'other'|'unknown';
export const debtLabels:Record<DebtKind,string>={credit_card:'Tarjeta de crédito',personal_loan:'Préstamo personal',auto_loan:'Préstamo de auto',other:'Otra obligación',unknown:'Sin clasificar'};
export interface DebtInput {
 id:string;name:string;kind:DebtKind;balanceCents:Cents;balanceAsOf:string|null;annualRateBps:number|null;
 minimumCents:Cents|null;dueDate:string|null;closingDate:string|null;feesCents:Cents|null;
 futureRateBps:number|null;rateChangeDate:string|null;
}
export interface Debt extends DebtInput {version:number;balanceRevision:number;archived:boolean;cyclePaidCents:Cents}
export interface DebtPayment {
 id:string;debtId:string;movementId:string;amountCents:Cents;date:string;paymentMethod:PaymentMethod;
 principalCents:Cents|null;interestCents:Cents|null;feesCents:Cents|null;appliedCents:Cents;balanceRevision:number|null;
 cycleDueDate:string|null;createdMovement:boolean;ownedBillPaymentId:string|null;reversedAt:string|null;reversalReason:string|null;
}
export interface DebtPaymentInput {
 id:string;debtId:string;expectedVersion:number;amountCents:Cents;date:string;paymentMethod:PaymentMethod;
 principalCents:Cents|null;interestCents:Cents|null;feesCents:Cents|null;applyToBalance:boolean;
 cycleDueDate:string|null;existingMovementId:string|null;confirmSimilar:boolean;billId:string|null;expectedBillVersion:number|null;
}
export interface DebtEvent {id:number;debtId:string;kind:string;effectiveDate:string|null;balanceBefore:Cents;balanceAfter:Cents;reason:string;recordedAt:string}
export interface DebtPlan {id:string;startDate:string;actions:{key:string;completedAt:string|null}[]}
export interface DebtSnapshot {debts:Debt[];payments:DebtPayment[];events:DebtEvent[];plans:DebtPlan[];movements:LedgerMovement[];bills:Bill[]}
export type Method = 'snowball'|'avalanche';
export interface Projection {
 status:'paid'|'limit';months:number;lastMonth:string|null;interestCents:Cents;paidCents:Cents;remainingCents:Cents;
 monthlyBudgetCents:Cents;nonReducingMonths:number;order:string[];
 rows:{month:number;label:string;interestCents:Cents;paymentCents:Cents;remainingCents:Cents}[];
}
