import {deletedGoalIds,deletedGoalReason} from './deletion';
import {FundsStore} from '../funds/store';
import {goalFundId,readFundData} from '../funds/read';
import {fundSummary,validateAllocationTimeline} from '../funds/domain';
import { UserInputError } from '../../core/errors';
import { cents,addAmounts } from '../../core/money';
import { MoneyStore,movementSelect,readMovement,type SqlDb } from '../money/store';
import { MovementRepository } from '../money/repository';
import { localToday,validDate } from '../money/domain';
import type { LedgerMovement } from '../money/types';
import { validateGoal } from './domain';
import type { Contribution,ContributionInput,Goal,GoalInput,GoalSnapshot } from './types';
const goalSelect=`SELECT g.id,g.name,g.kind,g.target_cents AS targetCents,g.opening_cents AS openingCents,g.desired_date AS desiredDate,COALESCE(g.cadence_yearly,g.cadence_detail,g.cadence) AS cadence,g.track_start_date AS trackStartDate,g.celebrated_target_cents AS celebratedTargetCents,g.version,g.archived FROM goals g`;
const contributionSelect=`SELECT c.id,c.goal_id AS goalId,c.movement_id AS movementId,c.amount_cents AS amountCents,m.date,c.created_movement AS createdMovement,c.reversed_at AS reversedAt,c.reversal_reason AS reversalReason FROM goal_contributions c JOIN movements m ON m.id=c.movement_id`;
const canonical=(g:GoalInput)=>JSON.stringify([g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence]);
function reasonValid(reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');}
export class GoalStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<GoalSnapshot>{return this.ledger.read(async db=>{
 const contributions=(await db.getAllAsync<Contribution>(contributionSelect+' ORDER BY m.date DESC,c.id')).map(c=>({...c,createdMovement:!!c.createdMovement}));
 const movements=(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC')).map(readMovement);
 const transfers=await db.getAllAsync<{id:string;goalId:string;amount:number;date:string;description:string;reversedAt:string|null}>(`SELECT t.id,t.date,t.description,t.reversed_at AS reversedAt,f.goal_id AS goalId, CASE WHEN t.to_id=f.id THEN t.amount_cents ELSE -t.amount_cents END AS amount FROM money_funds f JOIN fund_transfers t ON t.from_id=f.id OR t.to_id=f.id WHERE f.goal_id IS NOT NULL AND t.date<=?`,this.today());
 const deleted=await deletedGoalIds(db);
 const goals=(await db.getAllAsync<Goal>(goalSelect+' ORDER BY g.rowid DESC')).filter(g=>!deleted.has(g.id)).map(g=>({...g,archived:!!g.archived,savedCents:addAmounts(cents(g.openingCents),...contributions.filter(c=>c.goalId===g.id&&!c.reversedAt&&!movements.find(m=>m.id===c.movementId)?.deletedAt).map(c=>cents(c.amountCents)),...transfers.filter(t=>t.goalId===g.id&&!t.reversedAt).map(t=>cents(t.amount)))}));
 return {goals,contributions,movements,fundTransfers:transfers,events:await db.getAllAsync('SELECT goal_id AS goalId,reason,recorded_at AS recordedAt FROM goal_events ORDER BY id DESC')};
 });}
 async availableBalance(){return (await new FundsStore(this.ledger,this.today).summary('personal')).available;}
 async create(g:GoalInput){validateGoal(g);return this.ledger.transaction(db=>this.createInTransaction(db,g));}
 private async createInTransaction(db:SqlDb,g:GoalInput){
 const old=await db.getFirstAsync<Goal>(goalSelect+' WHERE g.id=?',g.id);if(old){if(old.archived||(await deletedGoalIds(db)).has(g.id))throw new UserInputError('Esta meta ya no está activa. Crea una nueva.');if(canonical(old)===canonical(g))return;throw new UserInputError('Este identificador ya pertenece a otra meta.');}
 if(await db.getFirstAsync('SELECT id FROM goals WHERE lower(trim(name))=lower(?) AND archived=0',g.name.trim()))throw new UserInputError('Ya hay una meta con ese nombre.');
 await db.runAsync('INSERT INTO goals(id,name,kind,target_cents,opening_cents,desired_date,cadence,cadence_detail,track_start_date,cadence_yearly) VALUES(?,?,?,?,?,?,?,?,?,?)',g.id,g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence==='weekly'?'weekly':'monthly',g.cadence==='yearly'?'monthly':g.cadence,this.today(),g.cadence==='yearly'?'yearly':null);
 }
 async createWithInitial(g:GoalInput,depositCents:number){validateGoal(g);if(cents(depositCents)<0||g.openingCents!==0)throw new UserInputError('El depósito inicial debe salir del Balance disponible.');return this.ledger.transaction(async db=>{
 await this.createInTransaction(db,g);
 const id='goal-initial:'+g.id,previous=await db.getFirstAsync<{amount:number;reversedAt:string|null;scope:string;fromId:string|null;toId:string|null}>('SELECT scope,from_id AS fromId,to_id AS toId,amount_cents AS amount,reversed_at AS reversedAt FROM fund_transfers WHERE id=?',id);
 if(previous){if(previous.amount===depositCents&&!previous.reversedAt&&previous.scope==='personal'&&previous.fromId===null&&previous.toId===goalFundId(g.id))return;throw new UserInputError('El depósito inicial ya fue registrado. Revisa el historial de la meta.');}
 if(depositCents>0){await new FundsStore(this.ledger,this.today).transferInTransaction(db,{id,scope:'personal',fromId:null,toId:goalFundId(g.id),amountCents:depositCents,date:this.today(),description:'Depósito inicial: '+g.name.trim()});}
 });}
 private async current(db:SqlDb,id:string,version:number){const g=await db.getFirstAsync<Goal>(goalSelect+' WHERE g.id=?',id);if(!g||g.version!==version||(await deletedGoalIds(db)).has(id))throw new UserInputError('La meta cambió. Cierra y vuelve a abrir su ficha.');return g;}
 async edit(g:GoalInput,version:number,reason:string,archived=false){validateGoal(g);reasonValid(reason);return this.ledger.transaction(async db=>{
 const old=await this.current(db,g.id,version);
 if(!archived&&await db.getFirstAsync('SELECT id FROM goals WHERE id<>? AND lower(trim(name))=lower(?) AND archived=0',g.id,g.name.trim()))throw new UserInputError('Ya hay una meta con ese nombre.');
 const active=await db.getAllAsync<{amount:number}>('SELECT amount_cents AS amount FROM goal_contributions WHERE goal_id=? AND reversed_at IS NULL',g.id);addAmounts(cents(g.openingCents),...active.map(c=>cents(c.amount)));
 await db.runAsync('INSERT INTO goal_events(goal_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',g.id,reason.trim(),JSON.stringify(old),new Date().toISOString());
 await db.runAsync('UPDATE goals SET name=?,kind=?,target_cents=?,opening_cents=?,desired_date=?,cadence=?,cadence_detail=?,cadence_yearly=?,track_start_date=?,archived=?,version=version+1 WHERE id=?',g.name.trim(),g.kind,g.targetCents,g.openingCents,g.desiredDate,g.cadence==='weekly'?'weekly':'monthly',g.cadence==='yearly'?'monthly':g.cadence,g.cadence==='yearly'?'yearly':null,old.targetCents===g.targetCents&&old.desiredDate===g.desiredDate&&old.cadence===g.cadence?(old.trackStartDate??this.today()):this.today(),Number(archived),g.id);
 validateAllocationTimeline(await readFundData(db),'personal',undefined,false);
 });}
 async remove(id:string,version:number){return this.ledger.transaction(async db=>{
 if((await deletedGoalIds(db)).has(id))return;
 const old=await this.current(db,id,version),data=await readFundData(db),fund=fundSummary(data,'personal',this.today()).funds.find(f=>f.goalId===id);
 if(!fund)throw new UserInputError('No encontramos el fondo de esta meta. Vuelve a abrirla.');
 if(fund.balanceCents<0)throw new UserInputError('Revisa el saldo de la meta antes de eliminarla.');
 const refundId='goal-delete:'+id;
 if(fund.balanceCents>0)await new FundsStore(this.ledger,this.today).transferInTransaction(db,{id:refundId,scope:'personal',fromId:fund.id,toId:null,amountCents:fund.balanceCents,date:this.today(),description:'Saldo devuelto al eliminar la meta: '+old.name});
 await db.runAsync('INSERT INTO goal_events(goal_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,deletedGoalReason,JSON.stringify({operation:'delete-goal',goal:old,refundId:fund.balanceCents>0?refundId:null}),new Date().toISOString());
 await db.runAsync('UPDATE goals SET archived=1,version=version+1 WHERE id=?',id);
 await db.runAsync('UPDATE money_funds SET archived=1,version=version+1 WHERE goal_id=?',id);
 });}
 async claimCompletion(id:string,target:number){return this.ledger.transaction(async db=>{const g=await db.getFirstAsync<Goal>(goalSelect+' WHERE g.id=?',id);if(!g||g.archived||g.targetCents!==target||g.celebratedTargetCents===target)return false;const contributions=await db.getAllAsync<{amount:number}>('SELECT c.amount_cents AS amount FROM goal_contributions c JOIN movements m ON m.id=c.movement_id WHERE c.goal_id=? AND c.reversed_at IS NULL AND m.deleted_at IS NULL',id);const transfers=await db.getAllAsync<{amount:number}>('SELECT CASE WHEN t.to_id=f.id THEN t.amount_cents ELSE -t.amount_cents END AS amount FROM money_funds f JOIN fund_transfers t ON t.from_id=f.id OR t.to_id=f.id WHERE f.goal_id=? AND t.reversed_at IS NULL AND t.date<=?',id,this.today());const saved=addAmounts(cents(g.openingCents),...contributions.map(c=>cents(c.amount)),...transfers.map(t=>cents(t.amount)));if(saved<target)return false;await db.runAsync('UPDATE goals SET celebrated_target_cents=? WHERE id=?',target,id);return true;});}
 async reserve(p:ContributionInput){return new FundsStore(this.ledger,this.today).transfer({id:'goal-reserve:'+p.id,scope:'personal',fromId:null,toId:goalFundId(p.goalId),amountCents:p.amountCents,date:p.date,description:'Aportación confirmada a la meta'});}
 async contribute(p:ContributionInput){
 if(!p.id||cents(p.amountCents)<=0||!validDate(p.date)||p.date>this.today()||!['cash','check','debit','bank','other'].includes(p.paymentMethod))throw new UserInputError('Revisa importe positivo, fecha no futura y método sin crédito.');
 return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<Contribution>(contributionSelect+' WHERE c.id=?',p.id);
 if(old){if(!old.reversedAt&&old.goalId===p.goalId&&old.amountCents===p.amountCents&&old.date===p.date&&old.movementId===(p.existingMovementId??`goal-movement:${p.id}`)){const m=await db.getFirstAsync<{method:string}>('SELECT payment_method AS method FROM movements WHERE id=?',old.movementId);if(m?.method===p.paymentMethod)return;}throw new UserInputError('Este identificador ya pertenece a otra aportación.');}
 const g=await this.current(db,p.goalId,p.expectedVersion);if(g.archived)throw new UserInputError('Reactiva la meta antes de aportar.');
 const active=await db.getAllAsync<{amount:number}>('SELECT amount_cents AS amount FROM goal_contributions WHERE goal_id=? AND reversed_at IS NULL',g.id);addAmounts(cents(g.openingCents),...active.map(c=>cents(c.amount)),cents(p.amountCents));
 const movementId=p.existingMovementId??`goal-movement:${p.id}`;
 if(p.existingMovementId){
 const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',movementId);
 if(!m||m.deletedAt||m.kind!=='goal_contribution'||m.amountCents!==p.amountCents||m.date!==p.date||m.paymentMethod!==p.paymentMethod)throw new UserInputError('La transacción debe ser una aportación con el mismo importe, fecha y método.');
 if(await db.getFirstAsync(`SELECT id FROM goal_contributions WHERE movement_id=? AND reversed_at IS NULL UNION ALL SELECT id FROM bill_payments WHERE movement_id=? UNION ALL SELECT id FROM debt_payments WHERE movement_id=? AND reversed_at IS NULL`,movementId,movementId,movementId))throw new UserInputError('La transacción ya está vinculada.');
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
 if(linked?.n)throw new UserInputError('Revisa primero los documentos u otros vínculos de la transacción.');
 const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',p.movementId);await db.runAsync('INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)',p.movementId,'delete',reason.trim(),JSON.stringify(m),now);
 await db.runAsync('UPDATE movements SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?',now,now,p.movementId);
 }
 await db.runAsync('UPDATE goal_contributions SET reversed_at=?,reversal_reason=? WHERE id=?',now,reason.trim(),id);await db.runAsync('UPDATE goals SET version=version+1 WHERE id=?',p.goalId);validateAllocationTimeline(await readFundData(db),'personal',undefined,false);
 });}
}
