import type { LedgerMovement } from '../money/types';
import type { StoredDocument } from '../documents/types';
import type { BusinessSnapshot } from './types';
export type BusinessUse='business'|'personal'|'mixed'|'pending';
export type CPAStatus='pending'|'reviewed'|'changes';
export type ReserveKind='tax'|'ivu'|'payroll';
export interface Allocation {projectId:string;amountCents:number}
export interface EntryInput {
 id:string;holderId:string;kind:'income'|'expense';
 date:string;description:string;amountCents:number;paymentMethod:string;
 existingMovementId:string|null;expectedMovementVersion:number|null;
 useKind:BusinessUse;businessBps:number|null;justification:string;cpaStatus:CPAStatus;
 grossCents:number|null;commissionCents:number|null;refundCents:number|null;ivuCents:number|null;
 allocations:Allocation[];confirmSimilar:boolean;
}
export interface BusinessEntry extends Omit<EntryInput,'existingMovementId'|'expectedMovementVersion'|'confirmSimilar'> {
 movementId:string;movementVersion:number;version:number;updatedAt:string;stale:boolean;deletedAt:string|null;
}
export interface Reserve {holderId:string;kind:ReserveKind;amountCents:number;note:string;version:number;updatedAt:string}
export interface BusinessLedgerSnapshot extends BusinessSnapshot {
 entries:BusinessEntry[];reserves:Reserve[];documents:StoredDocument[];movements:LedgerMovement[];
}
