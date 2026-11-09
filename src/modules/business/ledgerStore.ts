import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { localToday,validateMovement } from '../money/domain';
import { MovementRepository } from '../money/repository';
import { MoneyStore,movementSelect,readMovement } from '../money/store';
import type { LedgerMovement } from '../money/types';
import type { StoredDocument } from '../documents/types';
import { BusinessStore } from './store';
import { validateEntry } from './ledgerDomain';
import type { Allocation,BusinessEntry,BusinessLedgerSnapshot,EntryInput,Reserve,ReserveKind } from './ledgerTypes';
const select=`SELECT e.id,e.holder_id AS holderId,e.movement_id AS movementId,e.kind,e.movement_version AS movementVersion,
 e.use_kind AS useKind,e.business_bps AS businessBps,e.justification,e.cpa_status AS cpaStatus,e.gross_cents AS grossCents,
 e.commission_cents AS commissionCents,e.refund_cents AS refundCents,e.ivu_cents AS ivuCents,e.version,e.updated_at AS updatedAt,
 m.date,m.description,m.amount_cents AS amountCents,m.payment_method AS paymentMethod,m.deleted_at AS deletedAt,
 (e.movement_version<>m.version OR e.kind<>m.kind) AS stale FROM business_entries e JOIN movements m ON m.id=e.movement_id`;
const docs=`SELECT d.id,d.movement_id AS movementId,d.bill_id AS billId,d.sha256,d.encrypted_path AS encryptedPath,d.supersedes_id AS supersedesId,d.status,d.source,d.record_kind AS kind,d.description,d.document_date AS date,d.amount_cents AS amountCents,d.notes,d.mime,d.created_at AS createdAt,d.deleted_at AS deletedAt,d.copy_deleted_at AS copyDeletedAt,d.version FROM documents d JOIN business_entries e ON e.movement_id=d.movement_id`;
export class BusinessLedgerStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<BusinessLedgerSnapshot> {
  const profiles=await new BusinessStore(this.ledger).snapshot();
  return this.ledger.read(async db=>{
   const raw=await db.getAllAsync<Omit<BusinessEntry,'allocations'|'stale'>&{stale:number}>(select+' ORDER BY m.date DESC,e.rowid DESC');
   const allocations=await db.getAllAsync<Allocation&{entryId:string}>('SELECT entry_id AS entryId,project_id AS projectId,amount_cents AS amountCents FROM business_allocations ORDER BY entry_id,project_id');
   return {...profiles,entries:raw.map(e=>({...e,stale:!!e.stale,allocations:allocations.filter(a=>a.entryId===e.id).map(({projectId,amountCents})=>({projectId,amountCents}))})),reserves:await db.getAllAsync<Reserve>('SELECT holder_id AS holderId,kind,amount_cents AS amountCents,note,version,updated_at AS updatedAt FROM business_reserves ORDER BY holder_id,kind'),documents:await db.getAllAsync<StoredDocument>(docs+' ORDER BY d.rowid'),movements:(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC')).map(readMovement)};
  });
 }
 async save(p:EntryInput,expectedVersion=0,reason='') {
  validateEntry(p,this.today());
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<{version:number;movementId:string;holderId:string}>('SELECT version,movement_id AS movementId,holder_id AS holderId FROM business_entries WHERE id=?',p.id);
   if((old?.version??0)!==expectedVersion)throw new UserInputError('El registro cambió. Vuelve a abrirlo.');
   if(old&&(!reason.trim()||reason.length>2000))throw new UserInputError('Explica la corrección del registro comercial.');
   if(!await db.getFirstAsync('SELECT id FROM business_holders WHERE id=?',p.holderId))throw new UserInputError('El titular ya no está disponible.');
   for(const a of p.allocations)if(!await db.getFirstAsync('SELECT id FROM business_projects WHERE id=? AND holder_id=?',a.projectId,p.holderId))throw new UserInputError('Cada proyecto debe pertenecer al titular seleccionado.');
   const movementId=p.existingMovementId??`business-movement:${p.id}`;
   if(old&&(old.movementId!==movementId||old.holderId!==p.holderId))throw new UserInputError('Una corrección conserva el movimiento y el titular originales.');
   const collision=await db.getFirstAsync<{id:string}>('SELECT id FROM business_entries WHERE movement_id=? AND id<>?',movementId,p.id);
   if(collision)throw new UserInputError('Ese movimiento ya tiene un registro comercial. Ábrelo; no se guardó otro.');
   let movement:LedgerMovement;
   const now=new Date().toISOString();
   if(p.existingMovementId) {
    const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',movementId);
    if(!m||m.deletedAt||m.version!==p.expectedMovementVersion||m.kind!==p.kind||m.amountCents!==p.amountCents||m.date!==p.date||m.description!==p.description||m.paymentMethod!==p.paymentMethod)throw new UserInputError('El movimiento cambió o no coincide. Vuelve a seleccionarlo para conciliar.');
    if(await db.getFirstAsync(`SELECT id FROM bill_payments WHERE movement_id=? UNION ALL SELECT id FROM debt_payments WHERE movement_id=? UNION ALL SELECT id FROM goal_contributions WHERE movement_id=?`,movementId,movementId,movementId))throw new UserInputError('Este pago pertenece a facturas, deudas o metas. No lo reclasifiques como otra compra comercial.');
    movement=m;
   }else{
    if(old)throw new UserInputError('Abre el movimiento original para corregir su clasificación.');
    if(!p.confirmSimilar&&await db.getFirstAsync('SELECT id FROM movements WHERE deleted_at IS NULL AND kind=? AND date=? AND amount_cents=?',p.kind,p.date,p.amountCents))throw new UserInputError('Hay un movimiento similar. Vincula el existente o confirma que es otro distinto.');
    movement={id:movementId,idempotencyKey:`business:${p.id}`,kind:p.kind,date:p.date,description:p.description,amountCents:cents(p.amountCents),currency:'USD',categoryId:null,paymentMethod:p.paymentMethod,taxReview:true,useKind:p.useKind==='pending'?'unknown':p.useKind,grossCents:p.kind==='income'&&p.grossCents!==null?cents(p.grossCents):null,withholdingCents:null,createdAt:now,updatedAt:now,deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1};
    validateMovement(movement);await new MovementRepository(db).create(movement);
   }
   const values=[p.kind,movement.version,p.useKind,p.businessBps,p.justification.trim(),p.cpaStatus,p.grossCents,p.commissionCents,p.refundCents,p.ivuCents,now] as const;
   if(old){
    const before=await db.getFirstAsync('SELECT * FROM business_entries WHERE id=?',p.id);
    const allocations=await db.getAllAsync('SELECT * FROM business_allocations WHERE entry_id=?',p.id);
    await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)','entry',p.id,JSON.stringify({entry:before,allocations}),reason.trim(),now);
    await db.runAsync('UPDATE business_entries SET kind=?,movement_version=?,use_kind=?,business_bps=?,justification=?,cpa_status=?,gross_cents=?,commission_cents=?,refund_cents=?,ivu_cents=?,updated_at=?,version=version+1 WHERE id=?',...values,p.id);
    await db.runAsync('DELETE FROM business_allocations WHERE entry_id=?',p.id);
   } else await db.runAsync('INSERT INTO business_entries(id,holder_id,movement_id,kind,movement_version,use_kind,business_bps,justification,cpa_status,gross_cents,commission_cents,refund_cents,ivu_cents,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',p.id,p.holderId,movementId,...values);
   for(const a of p.allocations)await db.runAsync('INSERT INTO business_allocations(entry_id,holder_id,project_id,amount_cents) VALUES(?,?,?,?)',p.id,p.holderId,a.projectId,a.amountCents);
   return movementId;
  });
 }
 async reserve(holderId:string,kind:ReserveKind,amountCents:number,note:string,expectedVersion:number) {
  if(!['tax','ivu','payroll'].includes(kind)||cents(amountCents)<0||!note.trim()||note.length>2000)throw new UserInputError('Revisa tipo, cantidad no negativa y motivo de la reserva.');
  return this.ledger.transaction(async db=>{
   if(!await db.getFirstAsync('SELECT id FROM business_holders WHERE id=?',holderId))throw new UserInputError('Titular no disponible.');
   const old=await db.getFirstAsync<{version:number}>('SELECT * FROM business_reserves WHERE holder_id=? AND kind=?',holderId,kind);
   if((old?.version??0)!==expectedVersion)throw new UserInputError('La reserva cambió. Vuelve a abrirla.');
   const now=new Date().toISOString();
   await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)','reserve',`${holderId}:${kind}`,JSON.stringify(old),note.trim(),now);
   await db.runAsync('INSERT INTO business_reserves(holder_id,kind,amount_cents,note,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(holder_id,kind) DO UPDATE SET amount_cents=excluded.amount_cents,note=excluded.note,version=version+1,updated_at=excluded.updated_at',holderId,kind,amountCents,note.trim(),now);
  });
 }
}
