import type {ContributionGoal,ContributionFrequency} from './contributions';
import type {AccountScope} from '../money/accountScope';
import type {Snapshot} from '../money/types';
import type {FundData} from '../funds/types';
import type {BillSnapshot} from '../bills/types';
import type {DebtSnapshot} from '../debts/types';
export type BudgetKind='needs'|'savings'|'debt'|'entertainment'|'investment'|'unexpected'|'custom';
export interface Allocation{id:string;name:string;color:string;kind:BudgetKind;amountCents:number;parentId:string|null;active:boolean;ledgerIds:string[];fundIds:string[];description:string;recommendation?:ContributionGoal}
export interface AnnualExpense{id:string;name:string;amountCents:number;dueDate:string;recurring:boolean;completed:boolean;fundId:string|null;billId:string|null;categoryId:string|null;contribution?:{frequency:ContributionFrequency;firstDate:string}}
export interface BudgetPlan{transferOnly?:boolean;distributionMode?:'scheduled';incomeBasis?:'available';month:string;scope:AccountScope;projectedCents:number|null;rows:Allocation[];annual:AnnualExpense[]}
export interface SavedBudget{plan:BudgetPlan;original:BudgetPlan|null;version:number;status:'draft'|'active';updatedAt:string;deletedAt:string|null}
export interface BudgetContext{money:Snapshot;funds:FundData;bills:BillSnapshot;debts:DebtSnapshot;today:string}
export interface BudgetLine extends Allocation{usedCents:number;remainingCents:number;percentUsed:number|null;excessCents:number}
export interface BudgetReport{transferOnly?:boolean;incomeBasis?:'available';incomeReceived:number;incomeScheduled:number;incomeEstimated:number;incomePending:number;incomeProjected:number;assigned:number;unassigned:number;overallocated:number;expenses:number;savings:number;investments:number;reserved:number;available:number;totalFunds:number;cashOut:number;lines:BudgetLine[];obligations:number;futureExpense:number;futureReserves:number;estimatedIncome:number;estimatedExpenses:number;estimatedSavings:number;estimatedAvailable:number;estimatedTotal:number;health:{level:'off'|'green'|'yellow'|'red';reasons:string[]};signals:string[]}
