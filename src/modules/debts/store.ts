import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { localToday, validDate, validateMovement } from '../money/domain';
import { MoneyStore, movementSelect, readMovement, type SqlDb } from '../money/store';
import { MovementRepository } from '../money/repository';
import type { LedgerMovement } from '../money/types';
import type { Bill } from '../bills/types';
import { minimumRemaining, planSteps, validateDebt, validateDebtPayment } from './domain';
import type { Debt, DebtEvent, DebtInput, DebtPayment, DebtPaymentInput, DebtPlan, DebtSnapshot } from './types';
const debtSelect=`SELECT d.id,d.name,d.kind,d.balance_cents AS balanceCents,d.balance_as_of AS balanceAsOf,d.balance_revision AS balanceRevision,
 d.annual_rate_bps AS annualRateBps,d.minimum_cents AS minimumCents,d.due_date AS dueDate,d.closing_date AS closingDate,d.fees_cents AS feesCents,
 d.future_rate_bps AS futureRateBps,d.rate_change_date AS rateChangeDate,d.archived,d.version,
 COALESCE((SELECT SUM(m.amount_cents) FROM debt_payments p JOIN movements m ON m.id=p.movement_id WHERE p.debt_id=d.id AND p.reversed_at IS NULL AND p.cycle_due_date=d.due_date),0) AS cyclePaidCents FROM debts d`;
const paymentSelect=`SELECT p.id,p.debt_id AS debtId,p.movement_id AS movementId,m.amount_cents AS amountCents,m.date,m.payment_method AS paymentMethod,
 p.principal_cents AS principalCents,p.interest_cents AS interestCents,p.fees_cents AS feesCents,p.applied_cents AS appliedCents,p.balance_revision AS balanceRevision,
 p.cycle_due_date AS cycleDueDate,p.created_movement AS createdMovement,p.owned_bill_payment_id AS ownedBillPaymentId,p.reversed_at AS reversedAt,p.reversal_reason AS reversalReason
 FROM debt_payments p JOIN movements m ON m.id=p.movement_id`;
const billSelect=`SELECT b.id,b.provider,b.amount_cents AS amountCents,b.due_date AS dueDate,b.category_id AS categoryId,b.payment_kind AS paymentKind,
 b.series_id AS seriesId,b.occurrence_date AS occurrenceDate,b.reminder_days AS reminderDays,b.version,b.created_at AS createdAt,b.updated_at AS updatedAt,
 b.voided_at AS voidedAt,b.recurrence AS legacyRecurrence,b.debt_id AS debtId,
 COALESCE((SELECT SUM(p.amount_cents) FROM bill_payments p WHERE p.bill_id=b.id AND p.reversed_at IS NULL),0) AS paidCents FROM bills b`;
const canonical=(d:DebtInput)=>JSON.stringify([d.name.trim(),d.kind,d.balanceCents,d.balanceAsOf,d.annualRateBps,d.minimumCents,d.dueDate,d.closingDate,d.feesCents,d.futureRateBps,d.rateChangeDate]);
export class SimilarDebtPaymentError extends UserInputError{constructor(){super('Ya hay un pago de deuda con ese importe y fecha. Revisa si es el mismo y vincúlalo, o confirma que es otro pago distinto.');}}
export class DebtStore{
 constructor(private ledger:MoneyStore,private today:()=>string=localToday){}
 private reason(reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');}
 private async debt(db:SqlDb,id:string,version?:number){const d=await db.getFirstAsync<Debt>(debtSelect+' WHERE d.id=?',id);if(!d||version!==undefined&&d.version!==version)throw new UserInputError('La deuda cambió. Cierra la ficha y vuelve a abrirla.');return {...d,archived:!!d.archived};}
 private async event(db:SqlDb,d:DebtInput,kind:string,before:number,after:number,date:string|null,reason:string,beforeJson:string|null=null){
  await db.runAsync('INSERT INTO debt_events(debt_id,kind,effective_date,balance_before,balance_after,reason,before_json,recorded_at) VALUES(?,?,?,?,?,?,?,?)',d.id,kind,date,before,after,reason.trim(),beforeJson,new Date().toISOString());
 }
 async create(d:DebtInput){validateDebt(d,this.today());if(!d.balanceAsOf)throw new UserInputError('Indica la fecha del saldo base.');return this.ledger.transaction(async db=>{
  const old=await db.getFirstAsync<Debt>(debtSelect+' WHERE d.id=?',d.id);if(old){if(canonical(old)!==canonical(d))throw new UserInputError('Este identificador ya corresponde a otra deuda.');return;}
  const similar=await db.getFirstAsync<{id:string}>('SELECT id FROM debts WHERE archived=0 AND lower(trim(name))=lower(?)',d.name.trim());if(similar)throw new UserInputError('Ya existe una deuda con ese nombre. Usa un nombre que distinga cada obligación.');
  await db.runAsync(`INSERT INTO debts(id,name,kind,balance_cents,balance_as_of,annual_rate_bps,minimum_cents,due_date,closing_date,fees_cents,future_rate_bps,rate_change_date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,d.id,d.name.trim(),d.kind,d.balanceCents,d.balanceAsOf,d.annualRateBps,d.minimumCents,d.dueDate,d.closingDate,d.feesCents,d.futureRateBps,d.rateChangeDate);
  await this.event(db,d,'opening',d.balanceCents,d.balanceCents,d.balanceAsOf,'Saldo base confirmado por el usuario');
 });}
 async edit(d:DebtInput,version:number,reason:string,reconcile:boolean){validateDebt(d,this.today());this.reason(reason);return this.ledger.transaction(async db=>{
  const old=await this.debt(db,d.id,version);
  if(!reconcile&&(old.balanceCents!==d.balanceCents||old.balanceAsOf!==d.balanceAsOf))throw new UserInputError('Para cambiar el saldo o su fecha, confirma una conciliación con un estado actualizado.');
  if(reconcile){
   if(!d.balanceAsOf)throw new UserInputError('La conciliación requiere la fecha del nuevo estado.');
   const latest=await db.getFirstAsync<{date:string|null}>(`SELECT MAX(m.date) AS date FROM debt_payments p JOIN movements m ON m.id=p.movement_id WHERE p.debt_id=? AND p.reversed_at IS NULL`,d.id);
   if(old.balanceAsOf&&d.balanceAsOf<old.balanceAsOf||latest?.date&&d.balanceAsOf<latest.date)throw new UserInputError('El nuevo saldo debe incluir los pagos ya registrados y no retroceder la fecha del estado.');
  }
  const sameName=await db.getFirstAsync<{id:string}>('SELECT id FROM debts WHERE lower(trim(name))=lower(?) AND id<>? AND archived=0',d.name.trim(),d.id);if(sameName)throw new UserInputError('Otra deuda ya tiene ese nombre.');
  await this.event(db,old,reconcile?'reconcile':'terms',old.balanceCents,d.balanceCents,d.balanceAsOf,reason,JSON.stringify(old));
  await db.runAsync(`UPDATE debts SET name=?,kind=?,balance_cents=?,balance_as_of=?,annual_rate_bps=?,minimum_cents=?,due_date=?,closing_date=?,fees_cents=?,future_rate_bps=?,rate_change_date=?,balance_revision=balance_revision+?,version=version+1 WHERE id=?`,d.name.trim(),d.kind,d.balanceCents,d.balanceAsOf,d.annualRateBps,d.minimumCents,d.dueDate,d.closingDate,d.feesCents,d.futureRateBps,d.rateChangeDate,Number(reconcile),d.id);
  if(old.archived&&d.balanceCents>0)await db.runAsync('UPDATE debts SET archived=0 WHERE id=?',d.id);
 });}
 async archive(id:string,version:number,reason:string){this.reason(reason);return this.ledger.transaction(async db=>{const d=await this.debt(db,id,version);if(d.balanceCents!==0)throw new UserInputError('Solo se archivan deudas con saldo registrado cero.');const pending=await db.getFirstAsync<{id:string}>(`SELECT b.id FROM bills b WHERE b.debt_id=? AND b.voided_at IS NULL AND b.amount_cents>COALESCE((SELECT SUM(p.amount_cents) FROM bill_payments p WHERE p.bill_id=b.id AND p.reversed_at IS NULL),0) LIMIT 1`,id);if(pending)throw new UserInputError('Revisa las facturas pendientes de esta deuda antes de archivarla.');await this.event(db,d,'archive',0,0,this.today(),reason,JSON.stringify(d));await db.runAsync('UPDATE debts SET archived=1,version=version+1 WHERE id=?',id);});}
 async pay(p:DebtPaymentInput){validateDebtPayment(p,this.today());return this.ledger.transaction(async db=>{
  const old=await db.getFirstAsync<DebtPayment>(paymentSelect+' WHERE p.id=?',p.id);
  if(old){if(old.reversedAt||old.debtId!==p.debtId||old.amountCents!==p.amountCents||old.date!==p.date||old.paymentMethod!==p.paymentMethod||old.movementId!==(p.existingMovementId??`debt-movement:${p.id}`)||old.principalCents!==p.principalCents||old.interestCents!==p.interestCents||old.feesCents!==p.feesCents||old.cycleDueDate!==p.cycleDueDate||old.appliedCents!==(p.applyToBalance?p.amountCents:0))throw new UserInputError('El identificador pertenece a otro pago.');
   const linked=old.ownedBillPaymentId?await db.getFirstAsync<{billId:string}>('SELECT bill_id AS billId FROM bill_payments WHERE id=?',old.ownedBillPaymentId):null;
   if((linked?.billId??null)!==p.billId)throw new UserInputError('El reintento no coincide con la factura del pago.');return;}
  const d=await this.debt(db,p.debtId,p.expectedVersion);if(d.archived)throw new UserInputError('La deuda está archivada.');
  if(!d.balanceAsOf)throw new UserInputError('Confirma primero la fecha del saldo base.');
  if(p.applyToBalance && (p.date<d.balanceAsOf||p.amountCents>d.balanceCents))throw new UserInputError('El pago debe ser posterior o igual al estado y no superar el saldo.');
  if(!p.applyToBalance&&p.date>d.balanceAsOf)throw new UserInputError('Un pago ya incluido en el saldo no puede ser posterior a la fecha de ese estado.');
  if(p.cycleDueDate&&!p.billId){
   const pending=await db.getFirstAsync<{id:string}>(`SELECT b.id FROM bills b WHERE b.debt_id=? AND b.voided_at IS NULL AND (b.due_date=? OR b.debt_bill_key=?) AND b.amount_cents>COALESCE((SELECT SUM(bp.amount_cents) FROM bill_payments bp WHERE bp.bill_id=b.id AND bp.reversed_at IS NULL),0) LIMIT 1`,d.id,p.cycleDueDate,`debt-minimum:${d.id}:${p.cycleDueDate}`);
   if(pending){const same=p.existingMovementId?await db.getFirstAsync<{id:string}>('SELECT id FROM bill_payments WHERE bill_id=? AND movement_id=? AND reversed_at IS NULL',pending.id,p.existingMovementId):null;if(!same)throw new UserInputError('Hay una factura pendiente para ese vencimiento. Elígela en el pago para no dejar el compromiso sin atender.');}
  }
  let movementId=p.existingMovementId;
  if(movementId){
   const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',movementId);
   if(!m||m.deletedAt||m.kind!=='debt_payment'||m.amountCents!==p.amountCents||m.date!==p.date||m.paymentMethod!==p.paymentMethod)throw new UserInputError('El movimiento debe ser un pago de deuda con el mismo importe, fecha y método.');
   const assigned=await db.getFirstAsync<{id:string}>('SELECT id FROM debt_payments WHERE movement_id=? AND reversed_at IS NULL',movementId);if(assigned)throw new UserInputError('Ese movimiento ya está asignado a una deuda.');
  }else{
   const similar=await db.getFirstAsync<{id:string}>('SELECT id FROM movements WHERE kind=\'debt_payment\' AND amount_cents=? AND date=? AND deleted_at IS NULL LIMIT 1',p.amountCents,p.date);if(similar&&!p.confirmSimilar)throw new SimilarDebtPaymentError();
   const now=new Date().toISOString();movementId=`debt-movement:${p.id}`;
   const m:LedgerMovement={id:movementId,idempotencyKey:`debt-payment:${p.id}`,kind:'debt_payment',amountCents:p.amountCents,currency:'USD',date:p.date,description:`Pago deuda: ${d.name}`,categoryId:null,paymentMethod:p.paymentMethod,taxReview:false,useKind:'unknown',grossCents:null,withholdingCents:null,createdAt:now,updatedAt:now,deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1};validateMovement(m);await new MovementRepository(db).create(m);
  }
  let ownedBill:string|null=null;
  if(p.billId){
   const b=await db.getFirstAsync<Bill>(billSelect+' WHERE b.id=?',p.billId);
   if(!b||b.voidedAt||b.paymentKind!=='debt_payment'||b.debtId&&b.debtId!==d.id||b.version!==p.expectedBillVersion||p.amountCents>b.amountCents-b.paidCents)throw new UserInputError('Revisa la factura: debe estar pendiente, corresponder a esta deuda y cubrir el pago.');
   const linked=await db.getFirstAsync<{id:string}>('SELECT id FROM bill_payments WHERE movement_id=? AND reversed_at IS NULL',movementId);if(linked)throw new UserInputError('Ese movimiento ya está vinculado a una factura; elige Solo deuda para asignarlo sin repetir el vínculo.');
   ownedBill=`debt-bill-payment:${p.id}`;await db.runAsync('INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents,created_movement) VALUES(?,?,?,?,0)',ownedBill,b.id,movementId,p.amountCents);
   await db.runAsync('UPDATE bills SET debt_id=?,version=version+1,updated_at=? WHERE id=?',d.id,new Date().toISOString(),b.id);
  }
  const applied=p.applyToBalance?p.amountCents:0;
  await db.runAsync(`INSERT INTO debt_payments(id,debt_id,movement_id,principal_cents,interest_cents,fees_cents,applied_cents,balance_revision,cycle_due_date,created_movement,owned_bill_payment_id) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,p.id,d.id,movementId,p.principalCents,p.interestCents,p.feesCents,applied,d.balanceRevision,p.cycleDueDate,Number(!p.existingMovementId),ownedBill);
  await db.runAsync('UPDATE debts SET balance_cents=balance_cents-?,version=version+1 WHERE id=?',applied,d.id);
  await this.event(db,d,'payment',d.balanceCents,d.balanceCents-applied,p.date,p.applyToBalance?'Pago confirmado; reduce el saldo registrado':'Pago confirmado ya incluido en el saldo base');
 });}
 private async reverseBill(db:SqlDb,id:string,reason:string){
  const b=await db.getFirstAsync<{billId:string;reversedAt:string|null}>('SELECT bill_id AS billId,reversed_at AS reversedAt FROM bill_payments WHERE id=?',id);if(!b||b.reversedAt)return;
  const now=new Date().toISOString();await db.runAsync('UPDATE bill_payments SET reversed_at=? WHERE id=?',now,id);await db.runAsync('INSERT INTO bill_payment_reversals(payment_id,reason,recorded_at) VALUES(?,?,?)',id,reason.trim(),now);await db.runAsync('UPDATE bills SET version=version+1,updated_at=? WHERE id=?',now,b.billId);
 }
 async reverse(id:string,reason:string){this.reason(reason);return this.ledger.transaction(async db=>{
  const p=await db.getFirstAsync<DebtPayment>(paymentSelect+' WHERE p.id=?',id);if(!p)throw new UserInputError('Pago no encontrado.');if(p.reversedAt)return;const d=await this.debt(db,p.debtId);
  if(p.createdMovement){
   const links=await db.getFirstAsync<{n:number}>(`SELECT (SELECT COUNT(*) FROM documents WHERE movement_id=?)+(SELECT COUNT(*) FROM tax_records WHERE movement_id=?)+(SELECT COUNT(*) FROM goal_contributions WHERE movement_id=?) AS n`,p.movementId,p.movementId,p.movementId);if(links?.n)throw new UserInputError('El movimiento tiene documentos u otros vínculos. Requiere revisión conjunta.');
   const bill=await db.getFirstAsync<{id:string}>('SELECT id FROM bill_payments WHERE movement_id=? AND reversed_at IS NULL',p.movementId);if(bill)await this.reverseBill(db,bill.id,reason);
   const m=await db.getFirstAsync<Record<string,unknown>>('SELECT * FROM movements WHERE id=?',p.movementId);const now=new Date().toISOString();await db.runAsync('INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)',p.movementId,'delete',reason.trim(),JSON.stringify(m),now);await db.runAsync('UPDATE movements SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?',now,now,p.movementId);
  }else if(p.ownedBillPaymentId)await this.reverseBill(db,p.ownedBillPaymentId,reason);
  const restored=p.balanceRevision===d.balanceRevision?p.appliedCents:0;const after=cents(d.balanceCents+restored);
  await db.runAsync('UPDATE debt_payments SET reversed_at=?,reversal_reason=? WHERE id=?',new Date().toISOString(),reason.trim(),id);await db.runAsync('UPDATE debts SET balance_cents=?,archived=CASE WHEN ?>0 THEN 0 ELSE archived END,version=version+1 WHERE id=?',after,after,d.id);
  await this.event(db,d,'reversal',d.balanceCents,after,this.today(),reason+(p.balanceRevision!==d.balanceRevision?' · Se conserva el saldo conciliado posteriormente.':''));
 });}
 async scheduleMinimum(id:string,version:number){return this.ledger.transaction(async db=>{
  const d=await this.debt(db,id,version);const amount=minimumRemaining(d);if(d.archived||!d.dueDate||amount===null||amount<=0)throw new UserInputError('Confirma vencimiento y mínimo pendiente antes de preparar una factura.');
  const key=`debt-minimum:${d.id}:${d.dueDate}`;const prior=await db.getFirstAsync<{id:string}>('SELECT id FROM bills WHERE debt_bill_key=?',key);if(prior)return prior.id;
  const now=new Date().toISOString();await db.runAsync(`INSERT INTO bills(id,provider,amount_cents,due_date,payment_kind,debt_id,debt_bill_key,created_at,updated_at) VALUES(?,?,?,?,'debt_payment',?,?,?,?)`,key,d.name,amount,d.dueDate,d.id,key,now,now);return key;
 });}
 async createPlan(id:string,start:string){if(!id||!validDate(start)||start>this.today())throw new UserInputError('Fecha de inicio no válida.');return this.ledger.transaction(async db=>{
  const old=await db.getFirstAsync<{start:string}>('SELECT start_date AS start FROM debt_plans WHERE id=?',id);if(old){if(old.start!==start)throw new UserInputError('El plan ya tiene otra fecha.');return;}
  const active=await db.getFirstAsync<{start:string}>('SELECT start_date AS start FROM debt_plans ORDER BY start_date DESC LIMIT 1');
  if(active&&new Date(`${start}T12:00:00Z`).getTime()-new Date(`${active.start}T12:00:00Z`).getTime()<30*86400000)throw new UserInputError('Conserva el plan actual hasta completar sus 30 días.');
  await db.runAsync('INSERT INTO debt_plans(id,start_date) VALUES(?,?)',id,start);for(const step of planSteps)await db.runAsync('INSERT INTO debt_plan_actions(plan_id,action_key) VALUES(?,?)',id,step.key);
 });}
 async checkAction(planId:string,key:string,done:boolean){if(!planSteps.some(s=>s.key===key))throw new UserInputError('Tarea no válida.');return this.ledger.transaction(async db=>{await db.runAsync('UPDATE debt_plan_actions SET completed_at=? WHERE plan_id=? AND action_key=?',done?new Date().toISOString():null,planId,key);});}
 async snapshot():Promise<DebtSnapshot>{return this.ledger.read(async db=>{
  const plans=await db.getAllAsync<{id:string;startDate:string}>('SELECT id,start_date AS startDate FROM debt_plans ORDER BY start_date DESC,id');const result:DebtPlan[]=[];
  for(const p of plans)result.push({...p,actions:await db.getAllAsync('SELECT action_key AS key,completed_at AS completedAt FROM debt_plan_actions WHERE plan_id=?',p.id)});
  return {debts:(await db.getAllAsync<Debt>(debtSelect+' ORDER BY d.archived,d.name')).map(d=>({...d,archived:!!d.archived})),payments:(await db.getAllAsync<DebtPayment>(paymentSelect+' ORDER BY m.date DESC,p.id')).map(p=>({...p,createdMovement:!!p.createdMovement})),events:await db.getAllAsync<DebtEvent>('SELECT id,debt_id AS debtId,kind,effective_date AS effectiveDate,balance_before AS balanceBefore,balance_after AS balanceAfter,reason,recorded_at AS recordedAt FROM debt_events ORDER BY id DESC'),plans:result,movements:(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC,created_at DESC')).map(readMovement),bills:await db.getAllAsync<Bill>(billSelect+' ORDER BY b.due_date,b.id')};
 });}
}
