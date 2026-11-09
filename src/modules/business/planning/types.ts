import type { BusinessLedgerSnapshot } from '../ledgerTypes';
import type { ObligationsSnapshot } from '../obligations/types';
export type Answer='yes'|'no'|'pending';
export interface Plan {
 id:string;holderId:string;year:number;profileVersion:number;openingDate:string;openingCashCents:number|null;cashComplete:Answer;defaultOperating:Answer;
 taxScope:'pr'|'federal'|'combined';annualTaxCents:number|null;taxBasis:string;creditsCents:number|null;paymentsComplete:Answer;taxReserveAllocatedCents:number|null;
 ivu:Answer;contractors:Answer;employees:Answer;estimatedSchedule:'individual'|'corporation'|'manual'|'pending';calendarYear:Answer;notes:string;
}
export interface Treatment {id:string;holderId:string;entryId:string;entryVersion:number;role:'operating'|'equipment'|'tax'|'financing'|'owner'|'pending';note:string}
export interface CashEvent {id:string;holderId:string;date:string;direction:'in'|'out';amountCents:number|null;kind:'capital'|'loan'|'repayment'|'card_payment'|'equipment'|'other';movementId:string|null;movementVersion:number|null;reference:string;note:string}
export interface TaxPayment {id:string;holderId:string;year:number;date:string;jurisdiction:'pr'|'federal';amountCents:number|null;status:'pending'|'paid';cash:'linked'|'separate'|'pending';entryId:string|null;entryVersion:number|null;reference:string;note:string}
export interface Scenario {id:string;holderId:string;year:number;name:string;salesCents:number|null;expensesCents:number|null;collectionsCents:number|null;paymentsCents:number|null;equipmentCostCents:number|null;equipmentCashCents:number|null;taxChangeCents:number|null;assumptions:string}
export interface CalendarItem {id:string;holderId:string;year:number;name:string;date:string|null;source:string;status:'pending'|'done';completedDate:string|null;reference:string;note:string}
export interface Models {plan:Plan;treatment:Treatment;cash:CashEvent;payment:TaxPayment;scenario:Scenario;calendar:CalendarItem}
export type Kind=keyof Models;
export interface Saved<T> {value:T;version:number;updatedAt:string;voidedAt:string|null;voidReason:string}
export interface PlanningSnapshot {ledger:BusinessLedgerSnapshot;obligations:ObligationsSnapshot;records:{[K in Kind]:Saved<Models[K]>[]}}
export function blankPlan(holderId:string,year:number):Plan{return {id:`plan:${holderId}:${year}`,holderId,year,profileVersion:0,openingDate:`${year}-01-01`,openingCashCents:null,cashComplete:'pending',defaultOperating:'pending',taxScope:'pr',annualTaxCents:null,taxBasis:'',creditsCents:null,paymentsComplete:'pending',taxReserveAllocatedCents:null,ivu:'pending',contractors:'pending',employees:'pending',estimatedSchedule:'pending',calendarYear:'pending',notes:''};}
