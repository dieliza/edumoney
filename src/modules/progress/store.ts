import { MoneyStore,movementSelect,readMovement } from '../money/store';
import { localToday,validDate } from '../money/domain';
import { UserInputError } from '../../core/errors';
import { addAmounts,cents } from '../../core/money';
import type { LedgerMovement,Budget } from '../money/types';
import type { Goal } from '../goals/types';
import { progressSteps,type ProgressData,type ProgressPlan } from './domain';
export class ProgressStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<ProgressData>{return this.ledger.read(async db=>{
 const goals=await db.getAllAsync<Goal>(`SELECT id,name,kind,target_cents AS targetCents,opening_cents AS openingCents,desired_date AS desiredDate,cadence,version,archived FROM goals`);
 const contributions=await db.getAllAsync<{goalId:string;amount:number}>(`SELECT c.goal_id AS goalId,c.amount_cents AS amount FROM goal_contributions c JOIN movements m ON m.id=c.movement_id WHERE c.reversed_at IS NULL AND m.deleted_at IS NULL`);
 const plans=await db.getAllAsync<ProgressPlan>('SELECT id,start_date AS startDate FROM progress_plans ORDER BY start_date DESC,rowid DESC');
 for(const p of plans)p.actions=await db.getAllAsync('SELECT step_key AS key,completed_at AS completedAt FROM progress_actions WHERE plan_id=?',p.id);
 return {goals:goals.map(g=>({...g,archived:!!g.archived,savedCents:addAmounts(cents(g.openingCents),...contributions.filter(c=>c.goalId===g.id).map(c=>cents(c.amount)))})),
 movements:(await db.getAllAsync<LedgerMovement>(movementSelect)).map(readMovement),budgets:await db.getAllAsync<Budget>('SELECT month,category_id AS categoryId,amount_cents AS amountCents FROM monthly_budgets'),
 bills:await db.getAllAsync(`SELECT b.due_date AS dueDate,b.amount_cents AS amountCents,COALESCE(SUM(p.amount_cents),0) AS paidCents FROM bills b LEFT JOIN bill_payments p ON p.bill_id=b.id AND NOT EXISTS(SELECT 1 FROM bill_payment_reversals r WHERE r.payment_id=p.id) WHERE b.voided_at IS NULL GROUP BY b.id`),
 debtPayments:await db.getAllAsync(`SELECT m.date,p.applied_cents AS appliedCents,p.reversed_at AS reversedAt FROM debt_payments p JOIN movements m ON m.id=p.movement_id WHERE m.deleted_at IS NULL`),plans};
 });}
 async createPlan(id:string,start:string){if(!id||!validDate(start)||start!==this.today())throw new UserInputError('Inicia el plan con la fecha de hoy.');return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<ProgressPlan>('SELECT id,start_date AS startDate FROM progress_plans WHERE id=?',id);if(old){if(old.startDate===start)return;throw new UserInputError('Identificador de plan ya utilizado.');}
 const latest=await db.getFirstAsync<ProgressPlan>('SELECT id,start_date AS startDate FROM progress_plans ORDER BY start_date DESC LIMIT 1');
 if(latest&&Date.parse(start)-Date.parse(latest.startDate)<90*86400000)throw new UserInputError('Tu plan de 90 días sigue activo. Puedes continuar sus revisiones.');
 await db.runAsync('INSERT INTO progress_plans(id,start_date) VALUES(?,?)',id,start);
 for(const [key] of progressSteps)await db.runAsync('INSERT INTO progress_actions(plan_id,step_key) VALUES(?,?)',id,key);
 });}
 async check(id:string,key:string,done:boolean){if(!progressSteps.some(([k])=>k===key))throw new UserInputError('Revisión no válida.');return this.ledger.transaction(async db=>{
 const row=await db.getFirstAsync('SELECT plan_id FROM progress_actions WHERE plan_id=? AND step_key=?',id,key);if(!row)throw new UserInputError('Plan no encontrado.');
 await db.runAsync('UPDATE progress_actions SET completed_at=? WHERE plan_id=? AND step_key=?',done?new Date().toISOString():null,id,key);
 });}
}
