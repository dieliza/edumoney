import { UserInputError } from '../../core/errors';
import { cents,addAmounts } from '../../core/money';
import { MoneyStore,movementSelect,readMovement,type SqlDb } from '../money/store';
import { MovementRepository } from '../money/repository';
import { localToday,validDate } from '../money/domain';
import type { LedgerMovement } from '../money/types';
import { validateGoal } from './domain';
import type { Contribution,ContributionInput,Goal,GoalInput,GoalSnapshot } from './types';
const goalSelect=`SELECT g.id,g.name,g.kind,g.target_cents AS targetCents,g.opening_cents AS openingCents,g.desired_date AS desiredDate,g.cadence,g.version,g.archived FROM goals g`;
const contributionSelect=`SELECT c.id,c.goal_id AS goalId,c.movement_id AS movementId,c.amount_cents AS amountCents,m.date,c.created_movement AS createdMovement,c.reversed_at AS reversedAt,c.reversal_reason AS reversalReason FROM goal_contributions c JOIN movements m ON m.id=c.movement_id`;
const canonical=(g:GoalInput)=>JSON.stringify([g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence]);
function reasonValid(reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');}
export class GoalStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<GoalSnapshot>{return this.ledger.read(async db=>{
 const contributions=(await db.getAllAsync<Contribution>(contributionSelect+' ORDER BY m.date DESC,c.id')).map(c=>({...c,createdMovement:!!c.createdMovement}));
 const movements=(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC')).map(readMovement);
 const goals=(await db.getAllAsync<Goal>(goalSelect+' ORDER BY g.rowid DESC')).map(g=>({...g,archived:!!g.archived,savedCents:addAmounts(cents(g.openingCents),...contributions.filter(c=>c.goalId===g.id&&!c.reversedAt&&!movements.find(m=>m.id===c.movementId)?.deletedAt).map(c=>cents(c.amountCents)))}));
 return {goals,contributions,movements,events:await db.getAllAsync('SELECT goal_id AS goalId,reason,recorded_at AS recordedAt FROM goal_events ORDER BY id DESC')};
 });}
 async create(g:GoalInput){validateGoal(g);return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<Goal>(goalSelect+' WHERE g.id=?',g.id);if(old){if(canonical(old)===canonical(g))return;throw new UserInputError('Este identificador ya pertenece a otra meta.');}
 if(await db.getFirstAsync('SELECT id FROM goals WHERE lower(trim(name))=lower(?) AND archived=0',g.name.trim()))throw new UserInputError('Ya hay una meta con ese nombre.');
 await db.runAsync('INSERT INTO goals(id,name,kind,target_cents,opening_cents,desired_date,cadence) VALUES(?,?,?,?,?,?,?)',g.id,g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence);
 });}
 private async current(db:SqlDb,id:string,version:number){const g=await db.getFirstAsync<Goal>(goalSelect+' WHERE g.id=?',id);if(!g||g.version!==version)throw new UserInputError('La meta cambió. Cierra y vuelve a abrir su ficha.');return g;}
 async edit(g:GoalInput,version:number,reason:string,archived=false){validateGoal(g);reasonValid(reason);return this.ledger.transaction(async db=>{
 const old=await this.current(db,g.id,version);
 if(!archived&&await db.getFirstAsync('SELECT id FROM goals WHERE id<>? AND lower(trim(name))=lower(?) AND archived=0',g.id,g.name.trim()))throw new UserInputError('Ya hay una meta con ese nombre.');
 const active=await db.getAllAsync<{amount:number}>('SELECT amount_cents AS amount FROM goal_contributions WHERE goal_id=? AND reversed_at IS NULL',g.id);addAmounts(cents(g.openingCents),...active.map(c=>cents(c.amount)));
 await db.runAsync('INSERT INTO goal_events(goal_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',g.id,reason.trim(),JSON.stringify(old),new Date().toISOString());
 await db.runAsync('UPDATE goals SET name=?,kind=?,target_cents=?,opening_cents=?,desired_date=?,cadence=?,archived=?,version=version+1 WHERE id=?',g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence,Number(archived),g.id);
 });}
 async contribute(p:ContributionInput){
 if(!p.id||cents(p.amountCents)<=0||!validDate(p.date)||p.date>this.today()||!['cash','debit','bank','other'].includes(p.paymentMethod))throw new UserInputError('Revisa importe positivo, fecha no futura y método sin crédito.');
 return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<Contribution>(contributionSelect+' WHERE c.id=?',p.id);
 if(old){if(!old.reversedAt&&old.goalId===p.goalId&&old.amountCents===p.amountCents&&old.date===p.date&&old.movementId===(p.existingMovementId??`goal-movement:${p.id}`)){const m=await db.getFirstAsync<{method:string}>('SELECT payment_method AS method FROM movements WHERE id=?',old.movementId);if(m?.method===p.paymentMethod)return;}throw new UserInputError('Este identificador ya pertenece a otra aportación.');}
 const g=await this.current(db,p.goalId,p.expectedVersion);if(g.archived)throw new UserInputError('Reactiva la meta antes de aportar.');
 const active=await db.getAllAsync<{amount:number}>('SELECT amount_cents AS amount FROM goal_contributions WHERE goal_id=? AND reversed_at IS NULL',g.id);addAmounts(cents(g.openingCents),...active.map(c=>cents(c.amount)),cents(p.amountCents));
 const movementId=p.existingMovementId??`goal-movement:${p.id}`;
 if(p.existingMovementId){
 const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',movementId);
 if(!m||m.deletedAt||m.kind!=='goal_contribution'||m.amountCents!==p.amountCents||m.date!==p.date||m.paymentMethod!==p.paymentMethod)throw new UserInputError('El movimiento debe ser una aportación con el mismo importe, fecha y método.');
 if(await db.getFirstAsync(`SELECT id FROM goal_contributions WHERE movement_id=? AND reversed_at IS NULL UNION ALL SELECT id FROM bill_payments WHERE movement_id=? UNION ALL SELECT id FROM debt_payments WHERE movement_id=? AND reversed_at IS NULL`,movementId,movementId,movementId))throw new UserInputError('El movimiento ya está vinculado.');
 }else{
 if(!p.confirmSimilar&&await db.getFirstAsync(`SELECT id FROM movements WHERE kind='goal_contribution' AND deleted_at IS NULL AND date=? AND amount_cents=?`,p.date,p.amountCents))throw new UserInputError('Existe una aportación similar. Revisa o confirma que es otra distinta.');
 const now=new Date().toISOString();await new MovementRepository(db).create({id:movementId,idempotencyKey:movementId,kind:'goal_contribution',amountCents:cents(p.amountCents),currency:'USD',date:p.date,description:`Aportación: ${g.name}`,categoryId:null,paymentMethod:p.paymentMethod,taxReview:false,useKind:'personal',grossCents:null,withholdingCents:null,createdAt:now,updatedAt:now,deletedAt:null});
 }
 await db.runAsync('INSERT INTO goal_contributions(id,goal_id,movement_id,amount_cents,created_movement) VALUES(?,?,?,?,?)',p.id,g.id,movementId,p.amountCents,Number(!p.existingMovementId));
 await db.runAsync('UPDATE goals SET version=version+1 WHERE id=?',g.id);
 });}
 async reverse(id:string,reason:string){reasonValid(reason);return this.ledger.transaction(async db=>{
 const p=await db.getFirstAsync<Contribution>(contributionSelect+' WHERE c.id=?',id);if(!p)throw new UserInputError('Aportación no encontrada.');if(p.reversedAt)return;
 const now=new Date().toISOString();
 if(p.createdMovement){
 const linked=await db.getFirstAsync<{n:number}>(`SELECT (SELECT COUNT(*) FROM documents WHERE movement_id=?)+(SELECT COUNT(*) FROM tax_records WHERE movement_id=?)+(SELECT COUNT(*) FROM bill_payments WHERE movement_id=?)+(SELECT COUNT(*) FROM debt_payments WHERE movement_id=?) AS n`,p.movementId,p.movementId,p.movementId,p.movementId);
 if(linked?.n)throw new UserInputError('Revisa primero los documentos u otros vínculos del movimiento.');
 const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',p.movementId);await db.runAsync('INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)',p.movementId,'delete',reason.trim(),JSON.stringify(m),now);
 await db.runAsync('UPDATE movements SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?',now,now,p.movementId);
 }
 await db.runAsync('UPDATE goal_contributions SET reversed_at=?,reversal_reason=? WHERE id=?',now,reason.trim(),id);await db.runAsync('UPDATE goals SET version=version+1 WHERE id=?',p.goalId);
 });}
}
