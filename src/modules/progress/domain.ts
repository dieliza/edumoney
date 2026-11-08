import { addAmounts,cents } from '../../core/money';
import { UserInputError } from '../../core/errors';
import { validMonth } from '../money/domain';
import type { LedgerMovement,Budget } from '../money/types';
import type { Goal } from '../goals/types';
export const progressSteps=[
 ['start',1,'Revisar mi punto de partida'],['record',7,'Revisar mis movimientos'],['budget',14,'Revisar mi presupuesto'],
 ['bills',30,'Revisar facturas y vencimientos'],['debt',45,'Revisar mis deudas'],['savings',60,'Revisar mis aportaciones'],
 ['adjust',75,'Ajustar mi organización'],['review',90,'Revisar mis avances de 90 días'],
] as const;
export interface ProgressPlan {id:string;startDate:string;actions:{key:string;completedAt:string|null}[]}
export interface ProgressData {movements:LedgerMovement[];budgets:Budget[];goals:Goal[];bills:{dueDate:string;amountCents:number;paidCents:number}[];debtPayments:{date:string;appliedCents:number;reversedAt:string|null}[];plans:ProgressPlan[]}
export function progressSummary(d:ProgressData,month:string,today:string){
 if(!validMonth(month))throw new UserInputError('Mes no válido.');
 const rows=d.movements.filter(m=>!m.deletedAt&&m.date.startsWith(month)&&m.date<=today);
 const expenses=rows.filter(m=>m.kind==='expense');const budgets=d.budgets.filter(b=>b.month===month);
 const budget=addAmounts(...budgets.map(b=>b.amountCents));
 const spent=addAmounts(...expenses.filter(m=>budgets.some(b=>b.categoryId===m.categoryId)).map(m=>m.amountCents));
 const uncovered=addAmounts(...expenses.filter(m=>!budgets.some(b=>b.categoryId===m.categoryId)).map(m=>m.amountCents));
 const bills=d.bills.filter(b=>b.dueDate.startsWith(month)&&b.dueDate<=today);
 const reduction=addAmounts(...d.debtPayments.filter(p=>!p.reversedAt&&p.date.startsWith(month)&&p.date<=today).map(p=>cents(p.appliedCents)));
 return {movements:rows.length,expenses:addAmounts(...expenses.map(m=>m.amountCents)),budget:budgets.length?budget:null,spent,uncovered,billsDue:bills.length,billsPaid:bills.filter(b=>b.paidCents>=b.amountCents).length,reduction,goalsCompleted:d.goals.filter(g=>g.savedCents>=g.targetCents).length,goalsTotal:d.goals.length};
}
