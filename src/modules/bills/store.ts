import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { localToday, validDate, validateMovement } from '../money/domain';
import { MovementRepository } from '../money/repository';
import { MoneyStore, movementSelect, readMovement, type SqlDb } from '../money/store';
import type { Category, LedgerMovement } from '../money/types';
import { nextBillDate, outstanding, shiftDays, validateBill } from './domain';
import type { Bill, BillInput, BillPayment, BillSeries, BillSnapshot, PaymentInput, RecurrenceInput } from './types';
const selectBill = `SELECT b.id,b.provider,b.amount_cents AS amountCents,b.due_date AS dueDate,b.recurrence AS legacyRecurrence,
 b.category_id AS categoryId,b.payment_kind AS paymentKind,b.series_id AS seriesId,b.occurrence_date AS occurrenceDate,
 b.reminder_days AS reminderDays,b.version,b.created_at AS createdAt,b.updated_at AS updatedAt,b.voided_at AS voidedAt,
 COALESCE((SELECT SUM(p.amount_cents) FROM bill_payments p WHERE p.bill_id=b.id AND NOT EXISTS(SELECT 1 FROM bill_payment_reversals r WHERE r.payment_id=p.id)),0) AS paidCents FROM bills b`;
const selectSeries = `SELECT id,provider,amount_cents AS amountCents,category_id AS categoryId,payment_kind AS paymentKind,
 cadence,interval_count AS intervalCount,anchor_date AS anchorDate,next_date AS nextDate,end_date AS endDate,reminder_days AS reminderDays,active FROM bill_series`;
const selectPayment = `SELECT p.id,p.bill_id AS billId,p.movement_id AS movementId,p.amount_cents AS amountCents,m.date,m.payment_method AS paymentMethod,
 p.created_movement AS createdMovement,r.payment_id IS NOT NULL AS reversed,r.reason FROM bill_payments p JOIN movements m ON m.id=p.movement_id LEFT JOIN bill_payment_reversals r ON r.payment_id=p.id`;
const canonical = (b: BillInput) => JSON.stringify([b.provider.trim(),b.amountCents,b.dueDate,b.categoryId,b.paymentKind,b.reminderDays]);
export class SimilarBillError extends UserInputError { constructor(){super('Ya hay una factura con ese proveedor, importe y vencimiento. Revisa si es la misma antes de guardar otra.');} }
export class SimilarBillPaymentError extends UserInputError { constructor(){super('Hay un movimiento con ese importe, fecha y tipo. Revisa si es el mismo pago: puedes vincularlo o confirmar que es otro.');} }
export class BillsStore {
 constructor(private ledger: MoneyStore, private today:()=>string=localToday) {}
 private async bill(db:SqlDb,id:string,version?:number) {
  const b=await db.getFirstAsync<Bill>(selectBill+' WHERE b.id=?',id);
  if(!b || version!==undefined && b.version!==version) throw new UserInputError('La factura cambió. Cierra la ficha y vuelve a abrirla.'); return b;
 }
 private async category(db:SqlDb,b:BillInput,old?:Bill){
  if(!b.categoryId)return;
  const c=await db.getFirstAsync<{kind:string;archived:number}>('SELECT kind,archived FROM categories WHERE id=?',b.categoryId);
  if(!c || c.kind!=='expense' || c.archived && old?.categoryId!==b.categoryId)throw new UserInputError('Selecciona una categoría de gasto activa.');
 }
 private async insert(db:SqlDb,b:BillInput,seriesId:string|null,occurrence:string|null){
  const now=new Date().toISOString();
  await db.runAsync(`INSERT INTO bills(id,provider,amount_cents,due_date,category_id,payment_kind,series_id,occurrence_date,reminder_days,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,b.id,b.provider.trim(),b.amountCents,b.dueDate,b.categoryId,b.paymentKind,seriesId,occurrence,b.reminderDays,now,now);
 }
 async create(b:BillInput,recurrence:RecurrenceInput|null,confirmSimilar=false){
  validateBill(b);
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<Bill>(selectBill+' WHERE b.id=?',b.id);
   if(old){
    if(canonical(old)!==canonical(b) || old.seriesId!==(recurrence?.id??null))throw new UserInputError('Este identificador pertenece a otra factura.');
    if(recurrence){const s=await db.getFirstAsync<BillSeries>(selectSeries+' WHERE id=?',recurrence.id);if(!s || s.cadence!==recurrence.cadence || s.intervalCount!==recurrence.intervalCount || s.endDate!==recurrence.endDate)throw new UserInputError('La programación no coincide con el reintento.');}
    return;
   }
   const similar=await db.getFirstAsync<{id:string}>('SELECT id FROM bills WHERE voided_at IS NULL AND lower(trim(provider))=lower(?) AND amount_cents=? AND due_date=? AND payment_kind=? LIMIT 1',b.provider.trim(),b.amountCents,b.dueDate,b.paymentKind);
   if(similar && !confirmSimilar)throw new SimilarBillError();
   await this.category(db,b);
   if(recurrence){
    if(!recurrence.id || recurrence.endDate!==null && (!validDate(recurrence.endDate) || recurrence.endDate<b.dueDate)) throw new UserInputError('La fecha final debe ser igual o posterior al primer vencimiento.');
    const next=nextBillDate({anchorDate:b.dueDate,nextDate:b.dueDate,...recurrence});
    await db.runAsync(`INSERT INTO bill_series(id,provider,amount_cents,category_id,payment_kind,cadence,interval_count,anchor_date,next_date,end_date,reminder_days) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,recurrence.id,b.provider.trim(),b.amountCents,b.categoryId,b.paymentKind,recurrence.cadence,recurrence.intervalCount,b.dueDate,next,recurrence.endDate,b.reminderDays);
   }
   await this.insert(db,b,recurrence?.id??null,recurrence?b.dueDate:null);
  });
 }
 /** Ventana rodante de 90 días. Si hay un atraso muy largo se genera por lotes, sin descartar fechas. */
 async materialize(today:string){
  if(!validDate(today))throw new UserInputError('Fecha del dispositivo no válida.');
  const horizon=today>'9999-10-01'?'9999-12-31':shiftDays(today,90);
  return this.ledger.transaction(async db=>{
   const series=await db.getAllAsync<BillSeries>(selectSeries+' WHERE active=1 ORDER BY next_date');
   for(const s of series){
    const originalDate=s.nextDate;const originalActive=!!s.active;
    let count=0;
    while(s.nextDate<=horizon && (!s.endDate || s.nextDate<=s.endDate) && count<400){
     const date=s.nextDate;
     const prior=await db.getFirstAsync<{id:string}>('SELECT id FROM bills WHERE series_id=? AND occurrence_date=?',s.id,date);
     if(!prior)await this.insert(db,{id:`occurrence:${s.id}:${date}`,provider:s.provider,amountCents:s.amountCents,dueDate:date,categoryId:s.categoryId,paymentKind:s.paymentKind,reminderDays:s.reminderDays},s.id,date);
     if(date==='9999-12-31'){s.active=false;break;}
     try{s.nextDate=nextBillDate({...s,nextDate:date});}catch(e){if(date>'9990-01-01'){s.active=false;break;}throw e;}
     count++;
    }
    if(s.endDate && s.nextDate>s.endDate)s.active=false;
    if(originalDate!==s.nextDate || originalActive!==!!s.active)await db.runAsync('UPDATE bill_series SET next_date=?,active=? WHERE id=?',s.nextDate,Number(s.active),s.id);
   }
  });
 }
 async snapshot():Promise<BillSnapshot>{
  return this.ledger.read(async db=>({
   bills:await db.getAllAsync<Bill>(selectBill+' ORDER BY b.due_date,b.provider,b.id'),
   series:(await db.getAllAsync<BillSeries>(selectSeries+' ORDER BY next_date')).map(s=>({...s,active:!!s.active})),
   payments:(await db.getAllAsync<BillPayment>(selectPayment+' ORDER BY m.date DESC,p.id')).map(p=>({...p,reversed:!!p.reversed,createdMovement:!!p.createdMovement})),
   categories:(await db.getAllAsync<Category>('SELECT id,name,kind,archived FROM categories ORDER BY kind,name')).map(c=>({...c,archived:!!c.archived})),
   movements:(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC,created_at DESC')).map(readMovement),
  }));
 }
 async edit(b:BillInput,version:number,reason:string){
  validateBill(b);this.reason(reason);
  return this.ledger.transaction(async db=>{
   const old=await this.bill(db,b.id,version);
   if(old.voidedAt)throw new UserInputError('No se puede editar una factura anulada.');
   if(b.amountCents<old.paidCents)throw new UserInputError('El importe no puede ser menor que lo ya pagado.');
   const prior=await db.getFirstAsync<{id:string}>('SELECT id FROM bill_payments WHERE bill_id=? LIMIT 1',b.id);
   if(prior && (b.paymentKind!==old.paymentKind || b.categoryId!==old.categoryId))throw new UserInputError('Conserva el tipo y categoría: los pagos mantienen su clasificación original.');
   await this.category(db,b,old);await this.audit(db,old,reason);
   await db.runAsync('UPDATE bills SET provider=?,amount_cents=?,due_date=?,category_id=?,payment_kind=?,reminder_days=?,updated_at=?,version=version+1 WHERE id=?',b.provider.trim(),b.amountCents,b.dueDate,b.categoryId,b.paymentKind,b.reminderDays,new Date().toISOString(),b.id);
  });
 }
 private reason(reason:string){if(!reason.trim() || reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');}
 private async audit(db:SqlDb,b:Bill,reason:string){await db.runAsync('INSERT INTO bill_revisions(bill_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',b.id,reason.trim(),JSON.stringify(b),new Date().toISOString());}
 async voidBill(id:string,version:number,reason:string){
  this.reason(reason);return this.ledger.transaction(async db=>{
   const b=await this.bill(db,id,version);if(b.voidedAt)return;
   if(!outstanding(b))throw new UserInputError('La factura ya está pagada. Conserva su historial.');
   await this.audit(db,b,reason);await db.runAsync('UPDATE bills SET voided_at=?,updated_at=?,version=version+1 WHERE id=?',new Date().toISOString(),new Date().toISOString(),id);
  });
 }
 async toggleSeries(id:string,active:boolean){return this.ledger.transaction(async db=>{await db.runAsync('UPDATE bill_series SET active=? WHERE id=?',Number(active),id);});}
 async pay(p:PaymentInput){
  if(!p.id || !validDate(p.date) || p.date>this.today() || cents(p.amountCents)<=0 || !['cash','debit','credit','bank','other'].includes(p.paymentMethod))throw new UserInputError('Revisa importe, fecha y método del pago.');
  return this.ledger.transaction(async db=>{
   const previous=await db.getFirstAsync<BillPayment>(selectPayment+' WHERE p.id=?',p.id);
   if(previous){
    if(previous.reversed || previous.billId!==p.billId || previous.amountCents!==p.amountCents || previous.date!==p.date || previous.paymentMethod!==p.paymentMethod || previous.movementId!==(p.existingMovementId??`bill-movement:${p.id}`))throw new UserInputError('Este identificador pertenece a otro pago.');
    return;
   }
   const b=await this.bill(db,p.billId,p.expectedVersion);
   if(b.voidedAt || p.amountCents>outstanding(b))throw new UserInputError('El pago supera el pendiente o la factura está anulada.');
   if(b.paymentKind==='debt_payment' && p.paymentMethod==='credit')throw new UserInputError('Un pago de deuda no se registra como compra con crédito.');
   let movementId=p.existingMovementId;
   if(movementId){
    const m=await db.getFirstAsync<{kind:string;amountCents:number;date:string;paymentMethod:string;deletedAt:string|null}>(`SELECT kind,amount_cents AS amountCents,date,payment_method AS paymentMethod,deleted_at AS deletedAt FROM movements WHERE id=?`,movementId);
    if(!m || m.deletedAt || m.kind!==b.paymentKind || m.amountCents!==p.amountCents || m.date!==p.date || m.paymentMethod!==p.paymentMethod)throw new UserInputError('El movimiento debe coincidir exactamente en tipo, importe, fecha y método.');
    const linked=await db.getFirstAsync<{n:number}>(`SELECT (SELECT COUNT(*) FROM bill_payments WHERE movement_id=?)+(SELECT COUNT(*) FROM goal_contributions WHERE movement_id=?) AS n`,movementId,movementId);
    if(linked?.n)throw new UserInputError('El movimiento ya tiene un vínculo de pago. Revisa su registro de origen.');
   }else{
    const similar=await db.getFirstAsync<{id:string}>('SELECT id FROM movements WHERE deleted_at IS NULL AND kind=? AND amount_cents=? AND date=? LIMIT 1',b.paymentKind,p.amountCents,p.date);
    if(similar && !p.confirmSimilar)throw new SimilarBillPaymentError();
    const now=new Date().toISOString();movementId=`bill-movement:${p.id}`;
    const m:LedgerMovement={id:movementId,idempotencyKey:`bill-payment:${p.id}`,kind:b.paymentKind,amountCents:p.amountCents,currency:'USD',date:p.date,description:`Pago: ${b.provider}`,categoryId:b.categoryId,paymentMethod:p.paymentMethod,taxReview:false,useKind:'unknown',grossCents:null,withholdingCents:null,createdAt:now,updatedAt:now,deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1};
    validateMovement(m);await new MovementRepository(db).create(m);
   }
   await db.runAsync('INSERT INTO bill_payments(id,bill_id,movement_id,amount_cents,created_movement) VALUES(?,?,?,?,?)',p.id,b.id,movementId,p.amountCents,Number(!p.existingMovementId));
   await db.runAsync('UPDATE bills SET version=version+1,updated_at=? WHERE id=?',new Date().toISOString(),b.id);
  });
 }
 /** Desvincular no borra un gasto preexistente. Un movimiento creado aquí se retira de los cálculos con auditoría. */
 async reversePayment(id:string,reason:string){
  this.reason(reason);return this.ledger.transaction(async db=>{
   const p=await db.getFirstAsync<BillPayment>(selectPayment+' WHERE p.id=?',id);if(!p)throw new UserInputError('Pago no encontrado.');if(p.reversed)return;
   const b=await this.bill(db,p.billId);if(b.voidedAt)throw new UserInputError('La factura está anulada. Revisa el pago antes de anularla.');
   if(p.createdMovement){
    const linked=await db.getFirstAsync<{n:number}>(`SELECT (SELECT COUNT(*) FROM documents WHERE movement_id=?)+(SELECT COUNT(*) FROM tax_records WHERE movement_id=?)+(SELECT COUNT(*) FROM debt_payments WHERE movement_id=?) AS n`,p.movementId,p.movementId,p.movementId);
    if(linked?.n)throw new UserInputError('El pago tiene documentos u otros vínculos. Debe revisarse junto con ellos.');
    const m=await db.getFirstAsync<Record<string,unknown>>('SELECT * FROM movements WHERE id=?',p.movementId);
    const now=new Date().toISOString();
    await db.runAsync('INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,?,?,?,?)',p.movementId,'delete',reason.trim(),JSON.stringify(m),now);
    await db.runAsync('UPDATE movements SET deleted_at=?,updated_at=?,version=version+1 WHERE id=?',now,now,p.movementId);
   }
   await db.runAsync('INSERT INTO bill_payment_reversals(payment_id,reason,recorded_at) VALUES(?,?,?)',id,reason.trim(),new Date().toISOString());
   await db.runAsync('UPDATE bills SET version=version+1,updated_at=? WHERE id=?',new Date().toISOString(),b.id);
  });
 }
 async revisions(id:string){return this.ledger.read(db=>db.getAllAsync<{reason:string;recordedAt:string;beforeJson:string}>('SELECT reason,recorded_at AS recordedAt,before_json AS beforeJson FROM bill_revisions WHERE bill_id=? ORDER BY id DESC',id));}
}
