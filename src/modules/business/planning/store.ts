import { UserInputError } from '../../../core/errors';
import { localToday } from '../../money/domain';
import { BusinessLedgerStore } from '../ledgerStore';
import { BusinessObligationStore } from '../obligations/store';
import type { MoneyStore,SqlDb } from '../../money/store';
import type { Kind,Models,PlanningSnapshot,Saved } from './types';
import { validate } from './validation';
interface Row {id:string;holderId:string;kind:Kind;entryId:string|null;movementId:string|null;json:string;version:number;updatedAt:string;voidedAt:string|null;voidReason:string}
const query='SELECT id,holder_id AS holderId,kind,entry_id AS entryId,movement_id AS movementId,record_json AS json,version,updated_at AS updatedAt,voided_at AS voidedAt,void_reason AS voidReason FROM business_planning_records';
function decoded(r:Row){return {...JSON.parse(r.json),id:r.id,holderId:r.holderId,...(['treatment','payment'].includes(r.kind)?{entryId:r.entryId}:{}),...(r.kind==='cash'?{movementId:r.movementId}:{})};}
async function records(db:SqlDb){return db.getAllAsync<Row>(query+' ORDER BY rowid');}
export class PlanningStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<PlanningSnapshot>{
  const ledger=await new BusinessLedgerStore(this.ledger,this.today).snapshot(),obligations=await new BusinessObligationStore(this.ledger,this.today).snapshot();
  return this.ledger.read(async db=>{const data:PlanningSnapshot['records']={plan:[],treatment:[],cash:[],payment:[],scenario:[],calendar:[]};for(const r of await records(db)){const value=decoded(r);(data[r.kind] as Saved<Models[Kind]>[]).push({value,version:r.version,updatedAt:r.updatedAt,voidedAt:r.voidedAt,voidReason:r.voidReason});}return {ledger,obligations,records:data};});
 }
 async save<K extends Kind>(kind:K,value:Models[K],expectedVersion=0){
  validate(kind,value,this.today());
  return this.ledger.transaction(async db=>{
   const holder=await db.getFirstAsync<{version:number}>('SELECT version FROM business_holders WHERE id=?',value.holderId);if(!holder)throw new UserInputError('Selecciona un titular existente.');
   const old=await db.getFirstAsync<Row>(query+' WHERE id=?',value.id);
   if((old?.version??0)!==expectedVersion||old&&(old.holderId!==value.holderId||old.kind!==kind||old.voidedAt))throw new UserInputError('El registro cambió, está anulado o pertenece a otro titular.');
   const rows=(await records(db)).filter(r=>!r.voidedAt&&r.id!==value.id);
   let key=value.id,entryId:string|null=null,movementId:string|null=null;
   if(kind==='plan'){
    const p=value as Models['plan'];key=String(p.year);if(!Number.isInteger(p.profileVersion)||p.profileVersion<0||p.profileVersion>holder.version)throw new UserInputError('Revisa la versión del perfil antes de confirmar la proyección.');
    if(p.taxReserveAllocatedCents!==null){const reserve=await db.getFirstAsync<{amount:number}>('SELECT amount_cents AS amount FROM business_reserves WHERE holder_id=? AND kind=?',p.holderId,'tax');if(!reserve||p.taxReserveAllocatedCents>reserve.amount)throw new UserInputError('La asignación no puede exceder la reserva contributiva registrada.');}
   }
   if(kind==='treatment'||kind==='payment'){
    const v=value as Models['treatment']|Models['payment'];entryId=v.entryId;
    if(entryId){
     if(kind==='payment'&&rows.some(r=>r.kind==='payment'&&(decoded(r) as Models['payment']).entryId===entryId))throw new UserInputError('Este gasto ya tiene un pago estimado vinculado. Revisa el existente.');
     if(kind==='treatment'&&old&&(decoded(old) as Models['treatment']).entryId!==entryId)throw new UserInputError('Una clasificación conserva su movimiento original.');
     const e=await db.getFirstAsync<{version:number;holderId:string;kind:string;amount:number;stale:number;deleted:string|null}>('SELECT e.version,e.holder_id AS holderId,e.kind,m.amount_cents AS amount,(e.movement_version<>m.version OR e.kind<>m.kind) AS stale,m.deleted_at AS deleted FROM business_entries e JOIN movements m ON m.id=e.movement_id WHERE e.id=?',entryId);
     if(!e||e.holderId!==value.holderId||e.version!==v.entryVersion||e.stale||e.deleted)throw new UserInputError('El movimiento debe estar vigente y conciliado con este titular.');
     if(kind==='treatment'){key=entryId;const t=value as Models['treatment'];if(t.role!=='tax'&&rows.some(r=>r.kind==='payment'&&(decoded(r) as Models['payment']).entryId===entryId))throw new UserInputError('El gasto tiene un pago estimado vinculado; primero revisa o anula ese registro.');}
     else{const p=value as Models['payment'];if(e.kind!=='expense'||p.amountCents!==e.amount)throw new UserInputError('El pago estimado vinculado debe coincidir con el importe completo del gasto.');}
    }
   }
   if(kind==='cash'){
    const c=value as Models['cash'];key=c.reference.trim().toLocaleLowerCase();movementId=c.movementId;
    if(movementId){
     if(rows.some(r=>r.kind==='cash'&&(decoded(r) as Models['cash']).movementId===movementId))throw new UserInputError('Este movimiento ya tiene un ajuste de efectivo.');
     const m=await db.getFirstAsync<{version:number;amount:number;date:string;kind:string;deleted:string|null}>('SELECT version,amount_cents AS amount,date,kind,deleted_at AS deleted FROM movements WHERE id=?',movementId);
     if(!m||m.deleted||m.version!==c.movementVersion||m.amount!==c.amountCents||m.date!==c.date)throw new UserInputError('El movimiento de efectivo cambió o no coincide en importe y fecha.');
     if(await db.getFirstAsync('SELECT id FROM business_entries WHERE movement_id=?',movementId))throw new UserInputError('Ese movimiento ya está incluido en los registros comerciales; no vuelvas a sumarlo.');
     if(m.kind==='income'&&c.direction!=='in'||['expense','debt_payment','goal_contribution'].includes(m.kind)&&c.direction!=='out'||m.kind==='loan'&&c.direction!=='in')throw new UserInputError('La dirección de efectivo no corresponde al movimiento financiero.');
    }
   }
   if(kind==='payment'){
    const p=value as Models['payment'];if(p.status==='paid'){
     key=`${p.jurisdiction}:${p.reference.trim().toLocaleLowerCase()}`;
     if(rows.some(r=>r.kind==='payment'&&r.holderId===p.holderId&&(()=>{const q=decoded(r) as Models['payment'];return q.status==='paid'&&q.jurisdiction===p.jurisdiction&&q.reference.trim().toLocaleLowerCase()===p.reference.trim().toLocaleLowerCase();})()))throw new UserInputError('Este comprobante de estimada ya está registrado.');
    }
   }
   if(kind==='cash'||kind==='payment'){
    const reference=(value as Models['cash']|Models['payment']).reference.trim().toLocaleLowerCase();
    if(reference&&rows.some(r=>r.holderId===value.holderId&&r.kind!==kind&&['cash','payment'].includes(r.kind)&&((decoded(r) as Models['cash']|Models['payment']).reference.trim().toLocaleLowerCase()===reference)))throw new UserInputError('Esta referencia ya se incluyó en efectivo o pagos estimados. Revisa el registro existente para evitar duplicarlo.');
   }
   if(rows.some(r=>r.holderId===value.holderId&&r.kind===kind&&(()=>{const v=decoded(r) as Models[Kind];return kind==='plan'?String((v as Models['plan']).year)===key:kind==='treatment'?(v as Models['treatment']).entryId===key:kind==='cash'?(v as Models['cash']).reference.trim().toLocaleLowerCase()===key:false;})()))throw new UserInputError('Este perfil, movimiento o referencia ya está registrado. Abre el existente.');
   const now=new Date().toISOString();if(old)await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)',`planning:${kind}`,value.id,old.json,'Revisión del panel comercial',now);
   await db.runAsync('INSERT INTO business_planning_records(id,holder_id,kind,record_key,entry_id,movement_id,record_json,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET record_key=excluded.record_key,entry_id=excluded.entry_id,movement_id=excluded.movement_id,record_json=excluded.record_json,version=version+1,updated_at=excluded.updated_at',value.id,value.holderId,kind,key,entryId,movementId,JSON.stringify(value),now);
  });
 }
 async voidRecord(id:string,reason:string){if(!reason.trim()||reason.length>2000)throw new UserInputError('Explica la anulación.');return this.ledger.transaction(async db=>{const old=await db.getFirstAsync<Row>(query+' WHERE id=?',id);if(!old)throw new UserInputError('Registro no disponible.');if(old.voidedAt)return;const now=new Date().toISOString();await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)',`planning:${old.kind}`,id,old.json,reason.trim(),now);await db.runAsync('UPDATE business_planning_records SET voided_at=?,void_reason=?,version=version+1 WHERE id=?',now,reason.trim(),id);});}
}
