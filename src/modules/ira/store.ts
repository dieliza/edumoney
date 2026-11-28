import {BudgetStore} from '../budget/store';
import {budgetReport,allocationForFund} from '../budget/domain';
import {jurisdictions} from '../jurisdiction/domain';
import {nextIraDate} from './cadence';
import {UserInputError} from '../../core/errors';
import {cents} from '../../core/money';
import type {MoneyStore,SqlDb} from '../money/store';
import {localToday,validDate} from '../money/domain';
import {FundsStore} from '../funds/store';
import {readFundData} from '../funds/read';
import {fundSummary,validateAllocationTimeline} from '../funds/domain';
import {iraTypes,type IraAccount,type IraSchedule,type IraEvent} from './types';
export const iraSelect='SELECT id,institution,type,opened,initial_cents AS initialCents,version FROM ira_accounts';
const fail=(message:string):never=>{throw new UserInputError(message);};
export interface IraTaxInputs{year:number;jurisdiction:string;age:number;earnedCents:number;taxableCents:number|null;eligibility:number}
export class IraStore{
 readonly funds:FundsStore;
 constructor(private ledger:MoneyStore,private today=localToday){this.funds=new FundsStore(ledger,today);}
 snapshot(){return this.ledger.read(async db=>({accounts:await db.getAllAsync<IraAccount>(iraSelect),events:await db.getAllAsync<IraEvent>('SELECT id,account_id AS accountId,kind,amount_cents AS amountCents,date,reason,reverses_id AS reversesId,created_at AS createdAt FROM ira_events ORDER BY date,id'),schedules:await db.getAllAsync<IraSchedule>('SELECT id,account_id AS accountId,amount_cents AS amountCents,cadence,next_date AS nextDate,active FROM ira_schedules'),taxInputs:await db.getAllAsync<IraTaxInputs>('SELECT year,jurisdiction,age,earned_cents AS earnedCents,taxable_cents AS taxableCents,eligibility FROM ira_tax_inputs'),contributions:await db.getAllAsync<{transferId:string;accountId:string;taxYear:number}>('SELECT transfer_id AS transferId,account_id AS accountId,tax_year AS taxYear FROM ira_contributions'),funds:await readFundData(db)}));}
 async save(p:IraAccount){
  if(!/^ira:[a-zA-Z0-9-]{1,100}$/.test(p.id)||!p.institution.trim()||p.institution.length>100||!iraTypes.some(([type])=>type===p.type)||!validDate(p.opened)||p.opened>this.today()||cents(p.initialCents)<0)fail('Revisa institución, tipo, apertura y balance inicial.');
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<IraAccount>(iraSelect+' WHERE id=?',p.id);
   if((old?.version??0)!==p.version)fail('La cuenta cambió. Vuelve a abrirla.');
   if(old&&(old.initialCents!==p.initialCents||old.type!==p.type))fail('El balance inicial y el tipo conservan su historial. Usa una corrección o crea la cuenta del tipo correcto.');
   if(old&&old.opened!==p.opened&&(await db.getFirstAsync('SELECT id FROM fund_transfers WHERE (from_id=? OR to_id=?) AND date<? UNION ALL SELECT id FROM ira_events WHERE account_id=? AND date<? LIMIT 1',p.id,p.id,p.opened,p.id,p.opened)))fail('La apertura no puede ser posterior a movimientos ya registrados.');

   await db.runAsync('INSERT INTO ira_audit(account_id,before_json,reason,created_at) VALUES(?,?,?,?)',p.id,JSON.stringify(old??null),'Configuración IRA',new Date().toISOString());
   if(!old)await db.runAsync("INSERT INTO money_funds(id,scope,kind,name,created_at) VALUES(?,'personal','savings',?,?)",p.id,'IRA · '+p.institution.trim(),new Date().toISOString());
   await db.runAsync('INSERT INTO ira_accounts(id,institution,type,opened,initial_cents) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET institution=excluded.institution,opened=excluded.opened,version=version+1',p.id,p.institution.trim(),p.type,p.opened,p.initialCents);
   await db.runAsync('UPDATE money_funds SET name=? WHERE id=?','IRA · '+p.institution.trim(),p.id);
  });
 }
 private async account(db:SqlDb,id:string){const a=await db.getFirstAsync<IraAccount>(iraSelect+' WHERE id=?',id);if(!a)fail('Cuenta IRA no encontrada.');return a!;}
 async available(db:SqlDb,date=this.today()){
  const summary=fundSummary(await readFundData(db),'personal',date);
  const bills=await db.getAllAsync<{pending:number}>(`SELECT MAX(0,b.amount_cents-COALESCE((SELECT SUM(p.amount_cents) FROM bill_payments p WHERE p.bill_id=b.id AND NOT EXISTS(SELECT 1 FROM bill_payment_reversals r WHERE r.payment_id=p.id)),0)) AS pending FROM bills b WHERE b.voided_at IS NULL AND b.due_date<=?`,date.slice(0,7)+'-31');
  const obligations=bills.reduce((n,b)=>n+b.pending,0);
  return Math.max(0,summary.available-Math.max(0,obligations-summary.budget));
 }
 private async budgetGuard(){const before=await this.ledger.read(async db=>({changes:(await db.getFirstAsync<{n:number}>('SELECT total_changes() AS n'))!.n,hasPlan:!!await db.getFirstAsync('SELECT month FROM budget_plans WHERE scope=? AND month=? AND deleted_at IS NULL','personal',this.today().slice(0,7))}));if(!before.hasPlan)return undefined;const loaded=await new BudgetStore(this.ledger,this.today).load(this.today().slice(0,7),'personal'),report=budgetReport(loaded.plan,loaded.context),summary=fundSummary(loaded.context.funds,'personal',this.today()),covered=summary.funds.filter(f=>allocationForFund(loaded.plan,loaded.context,f.id)||loaded.plan.annual.some(a=>a.fundId===f.id)).reduce((n,f)=>n+Math.max(0,f.balanceCents),0);const after=await this.ledger.read(db=>db.getFirstAsync<{n:number}>('SELECT total_changes() AS n'));if(before.changes!==after!.n)fail('Los registros cambiaron mientras revisábamos el presupuesto. Vuelve a intentarlo.');return {changes:after!.n,available:Math.max(0,Math.min(summary.available,summary.available-report.futureExpense-Math.max(0,report.futureReserves-covered)))};}
 async spendable(){const guard=await this.budgetGuard();return this.ledger.read(async db=>Math.min(await this.available(db),guard?.available??Number.MAX_SAFE_INTEGER));}
 async contribute(p:{id:string;accountId:string;amountCents:number;date:string;taxYear:number;fromId?:string|null}){const guard=await this.budgetGuard();return this.ledger.transaction(db=>this.contributeInTransaction(db,p,guard));}
 private async contributeInTransaction(db:SqlDb,p:{id:string;accountId:string;amountCents:number;date:string;taxYear:number;fromId?:string|null},guard?:{changes:number;available:number}){
  if(!Number.isInteger(p.taxYear)||p.taxYear<1900||p.taxYear>9999)fail('Año contributivo no válido.');
   const a=await this.account(db,p.accountId);if(p.date<a.opened)fail('La aportación no puede preceder la apertura.');
   const from=p.fromId??null;
   const old=await db.getFirstAsync<{amount:number;accountId:string;date:string;fromId:string|null;taxYear:number}>('SELECT t.amount_cents AS amount,t.to_id AS accountId,t.date,t.from_id AS fromId,c.tax_year AS taxYear FROM fund_transfers t JOIN ira_contributions c ON c.transfer_id=t.id WHERE t.id=?',p.id);
   if(old){if(old.amount===p.amountCents&&old.accountId===p.accountId&&old.date===p.date&&old.fromId===from&&old.taxYear===p.taxYear)return;fail('El identificador ya corresponde a otra aportación.');}
   if(from===null&&guard){const current=await db.getFirstAsync<{n:number}>('SELECT total_changes() AS n');if(current!.n!==guard.changes)fail('El presupuesto o los balances cambiaron. Revisa la aportación.');if(p.amountCents>guard.available)fail('El dinero disponible después del presupuesto no alcanza.');}
   if(from===null&&p.amountCents>await this.available(db,p.date))fail('El dinero disponible después de obligaciones y reservas no alcanza.');
   if(from!==null){const data=await readFundData(db),f=data.funds.find(f=>f.id===from);if(!f||f.scope!=='personal'||f.kind!=='budget'||f.restricted)fail('Solo puedes usar una reserva presupuestaria existente o el balance disponible.');const summary=fundSummary(data,'personal',p.date),pending=await db.getAllAsync<{amount:number}>(`SELECT MAX(0,b.amount_cents-COALESCE((SELECT SUM(p.amount_cents) FROM bill_payments p WHERE p.bill_id=b.id AND NOT EXISTS(SELECT 1 FROM bill_payment_reversals r WHERE r.payment_id=p.id)),0)) AS amount FROM bills b WHERE b.voided_at IS NULL AND b.due_date<=?`,p.date.slice(0,7)+'-31');if(Math.max(0,summary.available)+Math.max(0,summary.budget-p.amountCents)<pending.reduce((n,b)=>n+b.amount,0))fail('Esta reserva es necesaria para atender obligaciones pendientes.');}
   await this.funds.transferInTransaction(db,{id:p.id,scope:'personal',fromId:from,toId:p.accountId,amountCents:p.amountCents,date:p.date,description:'Aportación IRA · '+p.taxYear},undefined,undefined,true);
   await db.runAsync('INSERT INTO ira_contributions(transfer_id,account_id,tax_year) VALUES(?,?,?)',p.id,p.accountId,p.taxYear);

 }

 async withdraw(p:{id:string;accountId:string;amountCents:number;date:string;reason:string}){
  if(!p.reason.trim()||p.reason.length>240)fail('Indica el motivo del retiro.');
  return this.ledger.transaction(async db=>{await this.account(db,p.accountId);await this.funds.transferInTransaction(db,{id:p.id,scope:'personal',fromId:p.accountId,toId:null,amountCents:p.amountCents,date:p.date,description:'Retiro IRA · '+p.reason},undefined,undefined,true);});
 }
 async record(p:IraEvent){
  if(!p.id||p.id.length>160||!['yield','correction'].includes(p.kind)||!p.reason.trim()||p.reason.length>240||!validDate(p.date)||p.date>this.today()||!cents(p.amountCents))fail('Revisa importe, fecha y motivo del rendimiento o corrección.');
  return this.ledger.transaction(async db=>{const a=await this.account(db,p.accountId);if(p.date<a.opened)fail('La fecha precede a la apertura.');const old=await db.getFirstAsync<IraEvent>('SELECT id FROM ira_events WHERE id=?',p.id);if(old)fail('Este registro ya existe; no se duplicó.');if(p.reversesId){const e=await db.getFirstAsync<{amount:number;accountId:string}>('SELECT amount_cents AS amount,account_id AS accountId FROM ira_events WHERE id=?',p.reversesId);if(!e||e.accountId!==p.accountId||p.amountCents!==-e.amount)fail('La reversión debe compensar exactamente el registro original.');}await db.runAsync('INSERT INTO ira_events(id,account_id,kind,amount_cents,date,reason,reverses_id,created_at) VALUES(?,?,?,?,?,?,?,?)',p.id,p.accountId,p.kind,p.amountCents,p.date,p.reason,p.reversesId,new Date().toISOString());validateAllocationTimeline(await readFundData(db),'personal',undefined,false);});
 }
 async schedule(p:IraSchedule){if(!p.id||p.id.length>160||cents(p.amountCents)<=0||!['weekly','biweekly','monthly','yearly'].includes(p.cadence)||!validDate(p.nextDate)||![0,1].includes(p.active))fail('Revisa la aportación programada.');return this.ledger.transaction(async db=>{await this.account(db,p.accountId);const old=await db.getFirstAsync<{accountId:string}>('SELECT account_id AS accountId FROM ira_schedules WHERE id=?',p.id);if(old&&old.accountId!==p.accountId)fail('La programación pertenece a otra cuenta.');await db.runAsync('INSERT INTO ira_schedules(id,account_id,amount_cents,cadence,next_date,active) VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET amount_cents=excluded.amount_cents,cadence=excluded.cadence,next_date=excluded.next_date,active=excluded.active',p.id,p.accountId,p.amountCents,p.cadence,p.nextDate,p.active);});}
 async executeSchedule(id:string,expectedDate:string){const guard=await this.budgetGuard();return this.ledger.transaction(async db=>{const s=await db.getFirstAsync<IraSchedule>('SELECT id,account_id AS accountId,amount_cents AS amountCents,cadence,next_date AS nextDate,active FROM ira_schedules WHERE id=?',id);if(!s||!s.active)fail('Programación no activa.');const transferId='ira-scheduled:'+id+':'+expectedDate;if(await db.getFirstAsync('SELECT transfer_id FROM ira_contributions WHERE transfer_id=?',transferId))return;if(s!.nextDate!==expectedDate||expectedDate>this.today())fail('La fecha programada cambió o todavía no vence.');await this.contributeInTransaction(db,{id:transferId,accountId:s!.accountId,amountCents:s!.amountCents,date:expectedDate,taxYear:Number(expectedDate.slice(0,4))},guard);await db.runAsync('UPDATE ira_schedules SET next_date=? WHERE id=?',nextIraDate(expectedDate,s!.cadence),id);});}
 saveTaxInputs(p:IraTaxInputs){if(!Number.isInteger(p.year)||p.year<1900||p.year>9999||!jurisdictions.some(([id])=>id===p.jurisdiction)||!Number.isInteger(p.age)||p.age<0||p.age>125||cents(p.earnedCents)<0||p.taxableCents!==null&&cents(p.taxableCents)<0||![0,1].includes(p.eligibility))fail('Confirma edad, ingresos y elegibilidad del año.');return this.ledger.transaction(db=>db.runAsync('INSERT INTO ira_tax_inputs(year,jurisdiction,age,earned_cents,taxable_cents,eligibility) VALUES(?,?,?,?,?,?) ON CONFLICT(year,jurisdiction) DO UPDATE SET age=excluded.age,earned_cents=excluded.earned_cents,taxable_cents=excluded.taxable_cents,eligibility=excluded.eligibility',p.year,p.jurisdiction,p.age,p.earnedCents,p.taxableCents,p.eligibility));}
 reverseTransfer(id:string,version:number,reason:string){return this.funds.reverse(id,version,reason);}
}
