import {UserInputError} from '../../core/errors';
import {cents} from '../../core/money';
import {localToday,validDate,validMonth} from '../money/domain';
import type {MoneyStore,SqlDb} from '../money/store';
import type {AccountScope} from '../money/accountScope';
import {fundSummary,validateAllocationTimeline,validateTransfer} from './domain';
import {readFundData,fundSelect,transferSelect,goalFundId} from './read';
import {locationKinds,type Fund,type FundInput,type FundTransfer,type MoneyLocation,type TransferInput} from './types';
function fail(s:string):never{throw new UserInputError(s);}
const text=(s:string)=>s.normalize('NFC').trim().replace(/\s+/g,' ');
const validName=(s:string)=>!!text(s)&&text(s).length<=100&&!/[\u0000-\u001f\u202a-\u202e\u2066-\u2069]/.test(s);
const transferKey=(p:TransferInput)=>JSON.stringify([p.scope,p.fromId,p.toId,p.amountCents,p.date,p.description.trim()]);
async function event(db:SqlDb,id:string,action:string,before:unknown,reason:string){await db.runAsync('INSERT INTO fund_events(entity_id,action,before_json,reason,recorded_at) VALUES(?,?,?,?,?)',id,action,JSON.stringify(before),reason.trim(),new Date().toISOString());}
async function materialize(db:SqlDb,f:Fund){if(f.version)return;await db.runAsync('INSERT INTO money_funds(id,scope,kind,name,goal_id,target_cents,contribution_cents,cadence,target_date,location_id,budget_month,category_id,archived,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',f.id,f.scope,f.kind,f.name,f.goalId,f.targetCents,f.contributionCents,f.cadence==='yearly'?'monthly':f.cadence,f.targetDate,f.locationId,f.budgetMonth,f.categoryId,Number(f.archived),new Date().toISOString());}
export class FundsStore{
 constructor(private ledger:MoneyStore,private today=localToday){}
 snapshot(){return this.ledger.read(readFundData);}
 async summary(scope:AccountScope,asOf=this.today()){return fundSummary(await this.snapshot(),scope,asOf);}
 async saveLocation(input:MoneyLocation){
  if(!input.id||!validName(input.name)||!locationKinds.some(([k])=>k===input.kind))fail('Escribe el nombre y el tipo de ubicación.');
  return this.ledger.transaction(async db=>{const old=await db.getFirstAsync<MoneyLocation>('SELECT id,name,kind,version FROM money_locations WHERE id=?',input.id);if(old&&old.name===text(input.name)&&old.kind===input.kind)return;if((old?.version??0)!==input.version)fail('La ubicación cambió. Vuelve a abrirla.');await event(db,input.id,'location',old??null,'Ubicación indicada por el usuario');await db.runAsync('INSERT INTO money_locations(id,name,kind) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,kind=excluded.kind,version=version+1',input.id,text(input.name),input.kind);});
 }
 async saveFund(p:FundInput,version=0,goalVersion?:number){
  if(!p.id||p.id.length>160||!['personal','business'].includes(p.scope)||!['savings','emergency','budget'].includes(p.kind)||!validName(p.name)||cents(p.targetCents)<0||cents(p.contributionCents)<0||!['weekly','biweekly','monthly','yearly'].includes(p.cadence)||p.targetDate!==null&&!validDate(p.targetDate)||p.budgetMonth!==null&&!validMonth(p.budgetMonth))fail('Revisa el nombre, objetivo, frecuencia y fechas del fondo.');
  return this.ledger.transaction(async db=>{
   const data=await readFundData(db),old=data.funds.find(f=>f.id===p.id);
   if((old?.version??0)!==version)fail('El fondo cambió. Vuelve a abrir su ficha.');
   if(old?.restricted)fail('Administra la cuenta restringida desde IRA; no se convierte en un fondo ordinario.');
   if(old&&(old.scope!==p.scope||old.goalId!==p.goalId))fail('No se puede cambiar la cuenta ni el vínculo de un fondo.');
   if(p.cadence==='yearly'&&!p.goalId)fail('La frecuencia anual se configura en una meta.');
   if(p.goalId&&(p.scope!=='personal'||p.targetCents<=0||p.kind==='budget'))fail('Revisa la meta personal vinculada.');
   if(p.locationId&&!data.locations.some(l=>l.id===p.locationId))fail('Selecciona una ubicación guardada.');
   if(p.categoryId&&!await db.getFirstAsync("SELECT id FROM categories WHERE id=? AND kind='expense'",p.categoryId))fail('Selecciona una categoría de gasto.');
   if(p.categoryId&&(p.kind!=='budget'||!p.budgetMonth))fail('Selecciona el mes del presupuesto.');
   if(p.goalId){const g=await db.getFirstAsync<{version:number;kind:string;target:number;date:string|null;cadence:string;start:string|null}>('SELECT version,kind,target_cents AS target,desired_date AS date,COALESCE(cadence_yearly,cadence_detail,cadence) AS cadence,track_start_date AS start FROM goals WHERE id=?',p.goalId);if(!g||goalVersion!==undefined&&goalVersion!==g.version)fail('La meta cambió. Vuelve a abrirla.');await db.runAsync('UPDATE goals SET name=?,target_cents=?,desired_date=?,cadence=?,cadence_detail=?,cadence_yearly=?,track_start_date=?,kind=?,version=version+1 WHERE id=?',text(p.name),p.targetCents,p.targetDate,p.cadence==='weekly'?'weekly':'monthly',p.cadence==='yearly'?'monthly':p.cadence,p.cadence==='yearly'?'yearly':null,g.target===p.targetCents&&g.date===p.targetDate&&g.cadence===p.cadence?(g.start??this.today()):this.today(),p.kind==='emergency'?'emergency':g.kind==='emergency'?'savings':g.kind,p.goalId);}
   if(old)await materialize(db,old);
   await event(db,p.id,'configure',old??null,'Configuración del fondo; no mueve dinero');
   await db.runAsync('INSERT INTO money_funds(id,scope,kind,name,goal_id,target_cents,contribution_cents,cadence,target_date,location_id,budget_month,category_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET kind=excluded.kind,name=excluded.name,target_cents=excluded.target_cents,contribution_cents=excluded.contribution_cents,cadence=excluded.cadence,target_date=excluded.target_date,location_id=excluded.location_id,budget_month=excluded.budget_month,category_id=excluded.category_id,version=version+1',p.id,p.scope,p.kind,text(p.name),p.goalId,p.targetCents,p.contributionCents,p.cadence==='yearly'?'monthly':p.cadence,p.targetDate,p.locationId,p.budgetMonth,p.categoryId,new Date().toISOString());
   if(p.scope==='personal'&&p.kind==='budget'&&p.categoryId&&p.budgetMonth)await db.runAsync('INSERT INTO monthly_budgets(month,category_id,amount_cents) VALUES(?,?,?) ON CONFLICT(month,category_id) DO UPDATE SET amount_cents=excluded.amount_cents',p.budgetMonth,p.categoryId,p.targetCents);
  });
 }
 /** A simulation is a plan, with zero realized savings regardless of projected opening/interest. */
 async createPlan(p:FundInput){
  if(p.scope!=='personal'||p.kind==='budget'||p.targetCents<=0||p.goalId===null||p.id!==goalFundId(p.goalId))fail('Revisa el identificador y objetivo de la meta.');
  if(!validName(p.name)||cents(p.targetCents)<=0||cents(p.contributionCents)<0||!['weekly','biweekly','monthly','yearly'].includes(p.cadence)||p.targetDate!==null&&!validDate(p.targetDate))fail('Completa el nombre, objetivo, aportación y fecha del plan.');
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<Fund>(fundSelect+' WHERE id=?',p.id);
   if(old){if(old.goalId===p.goalId&&old.name===text(p.name)&&old.targetCents===p.targetCents&&old.contributionCents===p.contributionCents&&old.scope===p.scope&&old.kind===p.kind&&old.cadence===p.cadence&&old.targetDate===p.targetDate&&old.locationId===p.locationId)return;fail('Esta meta ya se guardó con otros datos.');}
   if(p.locationId&&!await db.getFirstAsync('SELECT id FROM money_locations WHERE id=?',p.locationId))fail('Selecciona una ubicación existente.');
   if(await db.getFirstAsync('SELECT id FROM goals WHERE lower(trim(name))=lower(?) AND archived=0',text(p.name)))fail('Ya tienes una meta con ese nombre.');
   await db.runAsync('INSERT INTO goals(id,name,kind,target_cents,opening_cents,desired_date,cadence,cadence_detail,track_start_date,cadence_yearly) VALUES(?,?,?,?,0,?,?,?,?,?)',p.goalId,text(p.name),p.kind,p.targetCents,p.targetDate,p.cadence==='weekly'?'weekly':'monthly',p.cadence==='yearly'?'monthly':p.cadence,this.today(),p.cadence==='yearly'?'yearly':null);
   await db.runAsync('INSERT INTO money_funds(id,scope,kind,name,goal_id,target_cents,contribution_cents,cadence,target_date,location_id,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)',p.id,p.scope,p.kind,text(p.name),p.goalId,p.targetCents,p.contributionCents,p.cadence==='yearly'?'monthly':p.cadence,p.targetDate,p.locationId,new Date().toISOString());
   await event(db,p.id,'plan',null,'Plan creado desde una simulación; aportaciones sin confirmar');
  });
 }
 async transfer(input:TransferInput,expectedVersion?:number,plannedDestination?:FundInput){
  return this.ledger.transaction(db=>this.transferInTransaction(db,input,expectedVersion,plannedDestination));
 }
 /** Reuse the same transfer checks inside an existing atomic ledger operation. */
 async transferInTransaction(db:SqlDb,input:TransferInput,expectedVersion?:number,plannedDestination?:FundInput,iraOperation=false){
  validateTransfer(input,this.today());
  if(plannedDestination&&(plannedDestination.id!==input.toId||plannedDestination.scope!==input.scope||(plannedDestination.kind!=='budget'&&!(plannedDestination.kind==='savings'&&plannedDestination.id.startsWith('allocation:'+input.scope+':')))||!['annual:','allocation:'].some(prefix=>plannedDestination.id.startsWith(prefix+input.scope+':'))||plannedDestination.id.length>160||plannedDestination.contributionCents!==0||plannedDestination.cadence!=='monthly'||plannedDestination.locationId!==null||plannedDestination.categoryId!==null||!plannedDestination.budgetMonth||!validMonth(plannedDestination.budgetMonth)||plannedDestination.goalId!==null||!validName(plannedDestination.name)||!Number.isSafeInteger(plannedDestination.targetCents)||plannedDestination.targetCents<0||plannedDestination.targetDate!==null&&!validDate(plannedDestination.targetDate)))fail('Revisa el destino de la reserva.');
   if(plannedDestination&&!await db.getFirstAsync('SELECT id FROM money_funds WHERE id=?',plannedDestination.id)){const p=plannedDestination;await db.runAsync('INSERT INTO money_funds(id,scope,kind,name,target_cents,contribution_cents,cadence,target_date,location_id,budget_month,category_id,created_at) VALUES(?,?,?,?,?,0,?,?,?,?,?,?)',p.id,p.scope,p.kind,text(p.name),p.targetCents,p.cadence,p.targetDate,p.locationId,p.budgetMonth,p.categoryId,new Date().toISOString());await event(db,p.id,'plan',null,'Reserva creada al confirmar su primera transferencia');}
   let data=await readFundData(db);const old=await db.getFirstAsync<FundTransfer>(transferSelect+' WHERE id=?',input.id);
   if(old&&!old.reversedAt&&transferKey(old)===transferKey(input))return;
   if(old?.reversedAt)fail('Esta transferencia está revertida. Crea una nueva si corresponde.');
   if(old&&data.funds.some(f=>f.restricted&&f.archived&&(f.id===old.fromId||f.id===old.toId)))fail('Esta transferencia pertenece a una cuenta IRA eliminada.');
   if(old&&data.funds.some(f=>f.deletedGoal&&(f.id===old.fromId||f.id===old.toId)))fail('Esta transferencia pertenece a una meta eliminada y conserva su devolución.');
   if(old?(old.version!==expectedVersion||old.scope!==input.scope):expectedVersion!==undefined)fail('La transferencia cambió. Abre de nuevo su historial.');
   for(const id of [input.fromId,input.toId])if(id!==null){const f=data.funds.find(f=>f.id===id);if(!f||f.scope!==input.scope)fail('Origen y destino deben pertenecer a la misma cuenta.');if(f.restricted&&f.archived)fail('Esta cuenta IRA fue eliminada. Su historial se conserva.');if(f.restricted&&!iraOperation)fail('Registra las aportaciones y retiros desde IRA para conservar su año contributivo.');if(f.deletedGoal)fail('Esta meta fue eliminada. Su devolución y sus movimientos se conservan sin modificar.');if(id===input.toId&&f.archived)fail('Reactiva la meta antes de añadirle dinero.');await materialize(db,f);}
   await event(db,input.id,old?'edit':'transfer',old??null,old?'Corrección de transferencia':'Transferencia interna confirmada');
   if(old)await db.runAsync('UPDATE fund_transfers SET from_id=?,to_id=?,amount_cents=?,date=?,description=?,version=version+1 WHERE id=?',input.fromId,input.toId,input.amountCents,input.date,input.description.trim(),input.id);
   else await db.runAsync('INSERT INTO fund_transfers(id,scope,from_id,to_id,amount_cents,date,description,created_at) VALUES(?,?,?,?,?,?,?,?)',input.id,input.scope,input.fromId,input.toId,input.amountCents,input.date,input.description.trim(),new Date().toISOString());
   const affected=[input.fromId,input.toId,old?.fromId??null,old?.toId??null];await db.runAsync('UPDATE goals SET version=version+1 WHERE id IN (SELECT goal_id FROM money_funds WHERE id IN (?,?,?,?))',...affected);
   data=await readFundData(db);const changed=data.transfers.find(t=>t.id===input.id)!;validateAllocationTimeline(data,input.scope,{...changed,date:old&&old.date<input.date?old.date:input.date});
 }
 /** Correct an eliminated record without reactivating it or changing any balances. */
 async editReversed(input:TransferInput,expectedVersion:number){
  validateTransfer(input,this.today());
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<FundTransfer>(transferSelect+' WHERE id=?',input.id);
   if(!old||!old.reversedAt)fail('Abre de nuevo el historial de la transferencia eliminada.');
   if(old.scope!==input.scope||old.fromId!==input.fromId||old.toId!==input.toId)fail('Una transferencia eliminada conserva su origen y destino.');
   if(transferKey(old)===transferKey(input))return;
   if(old.version!==expectedVersion)fail('La transferencia cambió. Abre de nuevo su historial.');
   await event(db,input.id,'edit-reversed',old,'Corrección de datos; la transferencia continúa eliminada');
   await db.runAsync('UPDATE fund_transfers SET amount_cents=?,date=?,description=?,version=version+1 WHERE id=?',input.amountCents,input.date,input.description.trim(),input.id);
  });
 }
 async reverse(id:string,version:number,reason:string){return this.changeTransferHistory(id,version,reason,false);}
 async removeFromHistory(id:string,version:number){return this.changeTransferHistory(id,version,'Eliminada del historial de transferencias',true);}
 private async changeTransferHistory(id:string,version:number,reason:string,remove:boolean){
  if(!reason.trim()||reason.trim().length>240)fail('Escribe el motivo para revertir (hasta 240 caracteres).');
  return this.ledger.transaction(async db=>{const transfer=await db.getFirstAsync<FundTransfer>(transferSelect+' WHERE id=?',id);if(!transfer){if(remove)return;fail('Transferencia no encontrada.');}if(transfer.reversedAt&&!remove)return;if(transfer.version!==version)fail('La transferencia cambió. Vuelve a abrirla.');const deletionData=await readFundData(db);if(deletionData.funds.some(f=>f.restricted&&f.archived&&(f.id===transfer.fromId||f.id===transfer.toId)))fail('La cuenta IRA fue eliminada. Sus movimientos se conservan sin modificar.');if(deletionData.funds.some(f=>f.deletedGoal&&(f.id===transfer.fromId||f.id===transfer.toId)))fail('Esta transferencia pertenece a una meta eliminada. Se conserva su historial y la devolución registrada.');if(!transfer.reversedAt){await event(db,id,'reverse',transfer,reason);await db.runAsync('UPDATE fund_transfers SET reversed_at=?,reversal_reason=?,version=version+1 WHERE id=?',new Date().toISOString(),reason.trim(),id);await db.runAsync('UPDATE goals SET version=version+1 WHERE id IN (SELECT goal_id FROM money_funds WHERE id IN (?,?))',transfer.fromId,transfer.toId);validateAllocationTimeline(await readFundData(db),transfer.scope,transfer);}if(remove){await event(db,id,'remove-history',transfer,reason);await db.runAsync('DELETE FROM fund_transfers WHERE id=? AND reversed_at IS NOT NULL',id);}});
 }
}
