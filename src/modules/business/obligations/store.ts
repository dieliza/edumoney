import { UserInputError } from '../../../core/errors';
import { addAmounts,cents } from '../../../core/money';
import { localToday } from '../../money/domain';
import type { MoneyStore,SqlDb } from '../../money/store';
import { BusinessStore } from '../store';
import { RULE_VERSION } from './catalog';
import { evaluateWithholding } from './domain';
import { checkId,validateCollection,validateObligation,validateOffer,validatePayment,validateProvider,validateRelief } from './validation';
import type { ContractorPayment,ObligationRecord,ObligationsSnapshot,Provider,Relief,SUTCollection,SUTOffer,SavedCollection,SavedObligation,SavedOffer,SavedPayment } from './types';
// Lower bounds for reconciliation only. Unknown amounts stay null in records and totals.
const recordedMinimum=(values:(number|null)[])=>addAmounts(...values.filter((v):v is number=>v!==null).map(cents));
const collectedMinimum=(c:Pick<SUTCollection,'collectedCents'|'stateCents'|'municipalCents'>)=>c.collectedCents??recordedMinimum([c.stateCents,c.municipalCents]);
const providerSQL='SELECT id,legal_name AS name,legal_reference AS reference,classification,notes,version FROM business_contractors';
const reliefSQL='SELECT id,provider_id AS providerId,kind,valid_from AS validFrom,valid_to AS validTo,reference,document_id AS documentId FROM business_contractor_reliefs';
const paymentSQL=`SELECT sequence,id,holder_id AS holderId,provider_id AS providerId,payment_date AS date,services_cents AS servicesCents,ivu_cents AS ivuCents,reimbursed_cents AS reimbursedCents,actual_withheld_cents AS actualWithheldCents,actual_net_cents AS actualNetCents,scope,relief_status AS reliefStatus,relief_id AS reliefId,entry_id AS entryId,note,calculation_json AS calculationAtSave,provider_snapshot AS providerJSON,voided_at AS voidedAt,void_reason AS voidReason FROM business_contractor_payments`;
const obligationSQL=`SELECT id,holder_id AS holderId,provider_id AS providerId,flow,kind,form,period,municipality,scope,amount_cents AS amountCents,status,confirmed_date AS date,reference,note,due_date AS dueDate,due_source AS dueSource,voided_at AS voidedAt,void_reason AS voidReason FROM business_obligation_records`;
async function providers(db:SqlDb){return db.getAllAsync<Provider>(providerSQL+' ORDER BY rowid');}
async function reliefs(db:SqlDb){return db.getAllAsync<Relief>(reliefSQL+' ORDER BY rowid');}
async function payments(db:SqlDb){const rows=await db.getAllAsync<Omit<SavedPayment,'providerAtSave'>&{providerJSON:string}>(paymentSQL+' ORDER BY payment_date,sequence');return rows.map(({providerJSON,...p})=>({...p,providerAtSave:JSON.parse(providerJSON) as Provider}));}
async function holderExists(db:SqlDb,id:string){if(!await db.getFirstAsync('SELECT id FROM business_holders WHERE id=?',id))throw new UserInputError('Selecciona un titular legal existente.');}
async function entryLink(db:SqlDb,id:string|null,holderId:string,kind:'income'|'expense') {
 if(id&&!await db.getFirstAsync("SELECT e.id FROM business_entries e JOIN movements m ON m.id=e.movement_id WHERE e.id=? AND e.holder_id=? AND e.kind=? AND m.kind=e.kind AND m.deleted_at IS NULL AND m.version=e.movement_version",id,holderId,kind))throw new UserInputError('El movimiento comercial vinculado debe estar vigente, conciliado y pertenecer al titular.');
}
export class BusinessObligationStore {
 constructor(private ledger:MoneyStore,private today=localToday){}
 async snapshot():Promise<ObligationsSnapshot> {
  const profile=await new BusinessStore(this.ledger).snapshot();
  return this.ledger.read(async db=>{
   const rawOffers=await db.getAllAsync<{id:string;holderId:string;projectId:string|null;json:string;version:number;updatedAt:string}>('SELECT id,holder_id AS holderId,project_id AS projectId,config_json AS json,version,updated_at AS updatedAt FROM business_sut_offers ORDER BY rowid');
   const offers:SavedOffer[]=rawOffers.map(o=>({offer:{...JSON.parse(o.json) as SUTOffer,id:o.id,holderId:o.holderId,projectId:o.projectId},version:o.version,updatedAt:o.updatedAt}));
   const rawCollections=await db.getAllAsync<Omit<SavedCollection,'offerSnapshot'>&{json:string}>(`SELECT id,holder_id AS holderId,offer_id AS offerId,collection_date AS date,base_cents AS baseCents,collected_cents AS collectedCents,state_cents AS stateCents,municipal_cents AS municipalCents,actor,entry_id AS entryId,reference,note,offer_snapshot AS json,voided_at AS voidedAt,void_reason AS voidReason FROM business_sut_collections ORDER BY collection_date,rowid`);
   return {...profile,offers,collections:rawCollections.map(({json,...c})=>({...c,offerSnapshot:JSON.parse(json) as SUTOffer})),providers:await providers(db),reliefs:await reliefs(db),payments:await payments(db),obligations:await db.getAllAsync<SavedObligation>(obligationSQL+' ORDER BY period,rowid'),entries:(await db.getAllAsync<{id:string;holderId:string;kind:string;date:string;grossCents:number|null;ivuCents:number|null;stale:number;deletedAt:string|null;description:string}>(`SELECT e.id,e.holder_id AS holderId,e.kind,m.date,e.gross_cents AS grossCents,e.ivu_cents AS ivuCents,(m.version<>e.movement_version OR m.kind<>e.kind) AS stale,m.deleted_at AS deletedAt,m.description FROM business_entries e JOIN movements m ON m.id=e.movement_id ORDER BY m.date DESC`)).map(e=>({...e,stale:!!e.stale})),documents:await db.getAllAsync('SELECT id,description,deleted_at AS deletedAt FROM documents ORDER BY rowid DESC')};
  });
 }
 async saveOffer(o:SUTOffer,expectedVersion:number) {
  validateOffer(o);
  return this.ledger.transaction(async db=>{
   await holderExists(db,o.holderId);
   if(o.projectId&&!await db.getFirstAsync('SELECT id FROM business_projects WHERE id=? AND holder_id=?',o.projectId,o.holderId))throw new UserInputError('La oferta debe vincularse a un proyecto de este titular.');
   const old=await db.getFirstAsync<{holderId:string;version:number;json:string}>('SELECT holder_id AS holderId,version,config_json AS json FROM business_sut_offers WHERE id=?',o.id);
   if((old?.version??0)!==expectedVersion||(old&&old.holderId!==o.holderId))throw new UserInputError('La oferta cambió o pertenece a otro titular.');
   const now=new Date().toISOString();
   if(old)await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)','sut_offer',o.id,old.json,'Revisión de clasificación de la oferta',now);
   await db.runAsync('INSERT INTO business_sut_offers(id,holder_id,project_id,config_json,updated_at) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET project_id=excluded.project_id,config_json=excluded.config_json,version=version+1,updated_at=excluded.updated_at',o.id,o.holderId,o.projectId,JSON.stringify(o),now);
  });
 }
 async saveCollection(c:SUTCollection,confirmSimilar=false) {
  validateCollection(c,this.today());
  return this.ledger.transaction(async db=>{
   await holderExists(db,c.holderId);await entryLink(db,c.entryId,c.holderId,'income');
   const offer=await db.getFirstAsync<{json:string}>('SELECT config_json AS json FROM business_sut_offers WHERE id=? AND holder_id=?',c.offerId,c.holderId);
   if(!offer)throw new UserInputError('Selecciona una oferta de este titular.');
   if(await db.getFirstAsync('SELECT id FROM business_sut_collections WHERE id=?',c.id))throw new UserInputError('Este registro de IVU ya está guardado.');
   if(!confirmSimilar&&await db.getFirstAsync('SELECT id FROM business_sut_collections WHERE holder_id=? AND offer_id=? AND collection_date=? AND collected_cents IS ? AND voided_at IS NULL',c.holderId,c.offerId,c.date,c.collectedCents))throw new UserInputError('Hay un cobro de IVU similar; revisa antes de confirmar otro distinto.');
   if(c.reference.trim()&&await db.getFirstAsync('SELECT id FROM business_sut_collections WHERE holder_id=? AND reference=? AND voided_at IS NULL',c.holderId,c.reference.trim()))throw new UserInputError('La referencia de este cobro de IVU ya se registró.');
   if(c.entryId){
    const entry=await db.getFirstAsync<{ivuCents:number|null;grossCents:number|null}>('SELECT ivu_cents AS ivuCents,gross_cents AS grossCents FROM business_entries WHERE id=?',c.entryId);
    const rows=await db.getAllAsync<{collectedCents:number|null;stateCents:number|null;municipalCents:number|null;baseCents:number|null}>('SELECT collected_cents AS collectedCents,state_cents AS stateCents,municipal_cents AS municipalCents,base_cents AS baseCents FROM business_sut_collections WHERE entry_id=? AND voided_at IS NULL',c.entryId);
    if(entry?.ivuCents!==null&&entry?.ivuCents!==undefined&&recordedMinimum([collectedMinimum(c),...rows.map(collectedMinimum)])>entry.ivuCents)throw new UserInputError('Los registros de IVU excederían el IVU registrado en el cobro vinculado.');
    if(entry?.grossCents!==null&&entry?.grossCents!==undefined&&recordedMinimum([c.baseCents,...rows.map(r=>r.baseCents)])>entry.grossCents)throw new UserInputError('Las bases repartidas excederían las ventas brutas del registro vinculado.');
   }
   await db.runAsync('INSERT INTO business_sut_collections(id,holder_id,offer_id,collection_date,base_cents,collected_cents,state_cents,municipal_cents,actor,entry_id,reference,note,offer_snapshot,rule_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',c.id,c.holderId,c.offerId,c.date,c.baseCents,c.collectedCents,c.stateCents,c.municipalCents,c.actor,c.entryId,c.reference.trim(),c.note.trim(),offer.json,RULE_VERSION);
  });
 }
 async saveProvider(p:Provider,expectedVersion:number) {
  validateProvider(p);
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<Provider>(providerSQL+' WHERE id=?',p.id);
   if((old?.version??0)!==expectedVersion)throw new UserInputError('El proveedor cambió. Vuelve a abrirlo.');
   if(await db.getFirstAsync('SELECT id FROM business_contractors WHERE lower(trim(legal_reference))=lower(?) AND id<>?',p.reference.trim(),p.id))throw new UserInputError('Ya existe un proveedor con esa referencia legal local. Reutilízalo para conservar el acumulado.');
   if(old)await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)','contractor',p.id,JSON.stringify(old),'Revisión de proveedor sin cambiar su identificador',new Date().toISOString());
   await db.runAsync('INSERT INTO business_contractors(id,legal_name,legal_reference,classification,notes) VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET legal_name=excluded.legal_name,legal_reference=excluded.legal_reference,classification=excluded.classification,notes=excluded.notes,version=version+1',p.id,p.name.trim(),p.reference.trim(),p.classification,p.notes.trim());
  });
 }
 async saveRelief(r:Relief) {
  validateRelief(r);
  return this.ledger.transaction(async db=>{
   if(!await db.getFirstAsync('SELECT id FROM business_contractors WHERE id=?',r.providerId))throw new UserInputError('Proveedor no disponible.');
   if(r.documentId&&!await db.getFirstAsync('SELECT id FROM documents WHERE id=? AND deleted_at IS NULL',r.documentId))throw new UserInputError('El documento local no está disponible.');
   if(await db.getFirstAsync('SELECT id FROM business_contractor_reliefs WHERE id=? OR (provider_id=? AND reference=? AND valid_from=? AND kind=?)',r.id,r.providerId,r.reference.trim(),r.validFrom,r.kind))throw new UserInputError('Este documento de relevo o excepción ya está registrado.');
   await db.runAsync('INSERT INTO business_contractor_reliefs(id,provider_id,kind,valid_from,valid_to,reference,document_id) VALUES(?,?,?,?,?,?,?)',r.id,r.providerId,r.kind,r.validFrom,r.validTo,r.reference.trim(),r.documentId);
  });
 }
 async savePayment(p:ContractorPayment,confirmSimilar=false) {
  validatePayment(p,this.today());
  return this.ledger.transaction(async db=>{
   await holderExists(db,p.holderId);await entryLink(db,p.entryId,p.holderId,'expense');
   const provider=await db.getFirstAsync<Provider>(providerSQL+' WHERE id=?',p.providerId);
   if(!provider)throw new UserInputError('Selecciona un proveedor legal existente.');
   if(p.reliefId&&!await db.getFirstAsync('SELECT id FROM business_contractor_reliefs WHERE id=? AND provider_id=?',p.reliefId,p.providerId))throw new UserInputError('El relevo debe pertenecer a este proveedor.');
   if(await db.getFirstAsync('SELECT id FROM business_contractor_payments WHERE id=?',p.id))throw new UserInputError('Este pago ya tiene un registro de obligación.');
   if(!confirmSimilar&&await db.getFirstAsync('SELECT id FROM business_contractor_payments WHERE holder_id=? AND provider_id=? AND payment_date=? AND services_cents IS ? AND voided_at IS NULL',p.holderId,p.providerId,p.date,p.servicesCents))throw new UserInputError('Ya hay un pago similar al proveedor; revisa antes de confirmar otro distinto.');
   if(p.entryId){
    const linked=await db.getFirstAsync<{amount:number}>('SELECT m.amount_cents AS amount FROM business_entries e JOIN movements m ON m.id=e.movement_id WHERE e.id=?',p.entryId);
    const others=await db.getAllAsync<{net:number|null}>('SELECT actual_net_cents AS net FROM business_contractor_payments WHERE entry_id=? AND voided_at IS NULL',p.entryId);
    if(linked&&recordedMinimum([p.actualNetCents,...others.map(r=>r.net)])>linked.amount)throw new UserInputError('Los pagos vinculados excederían el gasto financiero existente.');
   }
   const calculated=evaluateWithholding(p,await payments(db),await providers(db),await reliefs(db));
   await db.runAsync('INSERT INTO business_contractor_payments(id,holder_id,provider_id,payment_date,services_cents,ivu_cents,reimbursed_cents,actual_withheld_cents,actual_net_cents,scope,relief_status,relief_id,entry_id,note,calculation_json,provider_snapshot) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',p.id,p.holderId,p.providerId,p.date,p.servicesCents,p.ivuCents,p.reimbursedCents,p.actualWithheldCents,p.actualNetCents,p.scope,p.reliefStatus,p.reliefId,p.entryId,p.note.trim(),JSON.stringify(calculated),JSON.stringify(provider));
   return calculated;
  });
 }
 async saveObligation(o:ObligationRecord) {
  validateObligation(o,this.today());
  return this.ledger.transaction(async db=>{
   await holderExists(db,o.holderId);
   if(o.providerId&&!await db.getFirstAsync('SELECT id FROM business_contractors WHERE id=?',o.providerId))throw new UserInputError('Proveedor de la informativa no disponible.');
   if(await db.getFirstAsync('SELECT id FROM business_obligation_records WHERE id=?',o.id))throw new UserInputError('Esta obligación ya está registrada.');
   if(o.status==='confirmed'&&await db.getFirstAsync('SELECT id FROM business_obligation_records WHERE holder_id=? AND flow=? AND kind=? AND form=? AND scope=? AND provider_id IS ? AND reference=? AND status=? AND voided_at IS NULL',o.holderId,o.flow,o.kind,o.form,o.scope,o.providerId,o.reference.trim(),'confirmed'))throw new UserInputError('Esta confirmación ya está registrada. No se sumó otro depósito o remesa.');
   await db.runAsync('INSERT INTO business_obligation_records(id,holder_id,provider_id,flow,kind,form,period,municipality,scope,amount_cents,status,confirmed_date,reference,note,due_date,due_source,rule_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',o.id,o.holderId,o.providerId,o.flow,o.kind,o.form,o.period,o.municipality,o.scope,o.amountCents,o.status,o.date,o.reference.trim(),o.note.trim(),o.dueDate,o.dueSource.trim(),RULE_VERSION);
  });
 }
 async voidRecord(kind:'collection'|'payment'|'obligation',id:string,reason:string) {
  checkId(id);if(!reason.trim()||reason.length>2000)throw new UserInputError('Explica la anulación del registro de obligación.');
  const table={collection:'business_sut_collections',payment:'business_contractor_payments',obligation:'business_obligation_records'}[kind];
  if(!table)throw new UserInputError('Tipo de registro no válido.');
  return this.ledger.transaction(async db=>{
   const old=await db.getFirstAsync<{voided_at:string|null}>(`SELECT * FROM ${table} WHERE id=?`,id);if(!old)throw new UserInputError('Registro no disponible.');if(old.voided_at)return;
   const now=new Date().toISOString();await db.runAsync('INSERT INTO business_ledger_events(entity_kind,entity_id,before_json,reason,recorded_at) VALUES(?,?,?,?,?)',kind,id,JSON.stringify(old),reason.trim(),now);
   await db.runAsync(`UPDATE ${table} SET voided_at=?,void_reason=? WHERE id=?`,now,reason.trim(),id);
  });
 }
}
