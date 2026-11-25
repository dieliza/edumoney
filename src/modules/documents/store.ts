import {linkCaptureCommercial} from './linkCaptureCommercial';
import {validateExpenseAnswers} from '../tax/expenseGuide';
import {recordExpenseGuide} from '../tax/guideStore';
import {validateReading} from './ai/details';
import {validateStatementRules} from '../income/store';
import {statementTotals} from '../income/domain';
import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { localToday,validDate,validateMovement } from '../money/domain';
import { validateBill } from '../bills/domain';
import { MovementRepository } from '../money/repository';
import { MoneyStore,movementSelect,readMovement,type SqlDb } from '../money/store';
import type { LedgerMovement } from '../money/types';
import { validateImage } from './domain';
import type { DocumentInput,DocumentsSnapshot,StoredDocument } from './types';
export class DuplicateDocumentError extends UserInputError {constructor(public documentId:string){super('Este comprobante ya existe. Abre su ficha; no se registró otra transacción.');}}
const select=`SELECT id,movement_id AS movementId,bill_id AS billId,sha256,encrypted_path AS encryptedPath,supersedes_id AS supersedesId,status,source,record_kind AS kind,description,document_date AS date,amount_cents AS amountCents,notes,mime,created_at AS createdAt,deleted_at AS deletedAt,copy_deleted_at AS copyDeletedAt,version,(SELECT record_json FROM document_readings WHERE document_id=documents.id) AS readingJson FROM documents`;
const target=(p:DocumentInput)=>({movementId:p.kind==='paid_expense'||p.kind==='paid_income'?`document-movement:${p.id}`:p.movementId,billId:p.kind==='pending_bill'?`document-bill:${p.id}`:p.billId});
const canonical=(d:Pick<StoredDocument,'description'|'date'|'amountCents'|'notes'|'kind'|'source'|'supersedesId'|'movementId'|'billId'>)=>JSON.stringify([d.description.trim(),d.date,d.amountCents,d.notes.trim(),d.kind,d.source,d.supersedesId,d.movementId,d.billId]);
export class DocumentStore {
 constructor(private ledger:MoneyStore,private digest:(text:string)=>Promise<string>,private today=localToday){}
 async findImageDuplicate(image:NonNullable<DocumentInput['image']>){
 validateImage(image);const sha=await this.digest(`image:${image.mime}:${image.base64}`);
 return this.ledger.read(async db=>(await db.getFirstAsync<{id:string}>('SELECT id FROM documents WHERE sha256=?',sha))?.id??null);
 }
 async snapshot():Promise<DocumentsSnapshot>{return this.ledger.read(async db=>({documents:await db.getAllAsync<StoredDocument>(select+' ORDER BY rowid DESC'),movements:(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC')).map(readMovement),bills:await db.getAllAsync('SELECT id,provider,amount_cents AS amountCents,due_date AS dueDate,version FROM bills WHERE voided_at IS NULL ORDER BY due_date DESC'),categories:(await db.getAllAsync<{id:string;name:string;kind:'income'|'expense';archived:number}>('SELECT id,name,kind,archived FROM categories')).map(c=>({...c,archived:!!c.archived}))}));}
 async save(p:DocumentInput){
 if(p.businessHolderId&&p.context!=='business')throw new UserInputError('Revisa la cuenta seleccionada.');
 if(p.expenseAnswers)validateExpenseAnswers(p.expenseAnswers);
 // Personal captures are data-only, regardless of a caller's keepImage flag.
 p={...p,keepImage:p.context==='business'&&!!p.image};
 if(p.reading)validateReading(p.reading);
 if(!p.id||!p.reviewed||p.description.length>240||p.notes.length>20000||(p.rawText?.length??0)>20000)throw new UserInputError('Revisa la descripción y confirma que comprobaste todos los datos.');
 if(!['paid_expense','paid_income','pending_bill','attachment','note'].includes(p.kind)||!['manual','camera','library','voice'].includes(p.source))throw new UserInputError('Elige cómo se guardará este documento.');
 if(p.date!==null&&!validDate(p.date)||p.amountCents!==null&&cents(p.amountCents)<=0)throw new UserInputError('Revisa la fecha AAAA-MM-DD y el importe positivo.');
 if(p.image)validateImage(p.image);if(p.keepImage&&!p.image)throw new UserInputError('No hay imagen para conservar.');
 if(p.incomeStatement){
 const statement=p.incomeStatement;statementTotals(statement);
 if(p.kind!=='paid_income'||p.amountCents!==statement.netCents||p.supersedesId)throw new UserInputError('El talonario debe vincularse una sola vez a su ingreso neto.');
 for(const date of [statement.periodStart,statement.periodEnd])if(date!==null&&!validDate(date))throw new UserInputError('Revisa las fechas del período.');
 if(statement.periodStart&&statement.periodEnd&&statement.periodStart>statement.periodEnd)throw new UserInputError('El inicio del período supera su fin.');
 }
 const financial=['paid_expense','paid_income','pending_bill'].includes(p.kind);
 if(financial&&(!p.date||p.amountCents===null))throw new UserInputError('Confirma fecha e importe antes de crear el registro financiero.');
 if((p.kind==='paid_expense'||p.kind==='paid_income')&&p.date!>this.today())throw new UserInputError('No se confirma como recibido o pagado una transacción futuro.');
 if(financial&&(p.movementId||p.billId))throw new UserInputError('Para vincular un registro existente elige Adjuntar; no crees otro.');
 if(p.kind==='attachment'&&Number(!!p.movementId)+Number(!!p.billId)!==1)throw new UserInputError('Elige una transacción o una factura existente, solo uno.');
 if(p.kind==='note'&&(p.movementId||p.billId||!p.notes.trim()))throw new UserInputError('Una nota necesita texto confirmado y no crea transacciones.');
 const links=target(p);const material=p.image?`image:${p.image.mime}:${p.image.base64}`:`text:${JSON.stringify([p.description.trim(),p.date,p.amountCents,p.notes.trim(),p.rawText,p.kind,...(p.incomeStatement?['income-statement',p.incomeStatement.reference]:[])])}`;const sha=await this.digest(material);
 if(!/^[a-f0-9]{64}$/.test(sha))throw new Error('Huella no válida');
 return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',p.id);
 if(old){if((old.readingJson??null)!==(p.reading?JSON.stringify(p.reading):null))throw new UserInputError('El desglose reconocido del reintento no coincide.');const detail=await db.getFirstAsync<{json:string}>('SELECT record_json AS json FROM income_statements WHERE document_id=?',p.id);if((detail?.json??null)!==(p.incomeStatement?JSON.stringify(p.incomeStatement):null))throw new UserInputError('El desglose del reintento no coincide.');if(old.sha256===sha&&canonical(old)===canonical({...p,...links})){const original=await db.getFirstAsync<{text:string|null}>('SELECT raw_text AS text FROM documents WHERE id=?',old.id);if(original?.text!==p.rawText)throw new UserInputError('El texto del reintento no coincide.');if(p.kind==='pending_bill'){const bill=await db.getFirstAsync<{category:string|null}>('SELECT category_id AS category FROM bills WHERE id=?',old.billId);if(bill?.category!==p.categoryId)throw new UserInputError('La categoría del reintento no coincide.');}if(p.kind==='paid_expense'||p.kind==='paid_income'){const m=await db.getFirstAsync<{method:string;category:string|null}>('SELECT payment_method AS method,category_id AS category FROM movements WHERE id=?',old.movementId);if(m?.method!==p.paymentMethod||m?.category!==p.categoryId)throw new UserInputError('El reintento no coincide con la transacción original.');}if(p.context&&['paid_expense','paid_income'].includes(p.kind)){const original=await db.getFirstAsync<{useKind:string}>('SELECT use_kind AS useKind FROM movements WHERE id=?',old.movementId);if((original?.useKind==='business')!==(p.context==='business'))throw new UserInputError('El registro ya pertenece a otra cuenta.');}if(p.businessHolderId){const linked=await db.getFirstAsync<{holderId:string}>('SELECT holder_id AS holderId FROM business_entries WHERE movement_id=?',old.movementId);if(linked?.holderId!==p.businessHolderId)throw new UserInputError('El registro ya pertenece a otra cuenta.');}return old.id;}throw new UserInputError('El identificador ya corresponde a otro documento.');}
 let resolvedVoice:StoredDocument|null=null;
 if(p.resolveVoiceNote){if(p.source!=='voice'||!['paid_income','paid_expense'].includes(p.kind)||p.resolveVoiceNote.id===p.id)throw new UserInputError('Solo un dictado confirmado puede resolver un pendiente.');resolvedVoice=await this.voiceNote(db,p.resolveVoiceNote.id,p.resolveVoiceNote.version);}
 const duplicate=await db.getFirstAsync<{id:string}>('SELECT id FROM documents WHERE sha256=?',sha);if(duplicate)throw new DuplicateDocumentError(duplicate.id);
 if(p.incomeStatement?.reference.trim()&&p.incomeStatement.issuer.trim()){
 const prior=await db.getAllAsync<{id:string;json:string}>('SELECT i.document_id AS id,i.record_json AS json FROM income_statements i JOIN movements m ON m.id=i.movement_id WHERE substr(m.date,1,4)=?',p.date!.slice(0,4));
 const same=prior.find(row=>{const before=JSON.parse(row.json);return String(before.reference).trim().toLocaleLowerCase('es')===p.incomeStatement!.reference.trim().toLocaleLowerCase('es')&&String(before.issuer).trim().toLocaleLowerCase('es')===p.incomeStatement!.issuer.trim().toLocaleLowerCase('es');});if(same)throw new DuplicateDocumentError(same.id);
 }
 if(!p.supersedesId&&!p.confirmSimilar&&p.date&&p.amountCents!==null&&await db.getFirstAsync('SELECT id FROM documents WHERE lower(trim(description))=lower(?) AND document_date=? AND amount_cents=? AND record_kind=?',p.description.trim(),p.date,p.amountCents,p.kind))throw new UserInputError('Hay un recibo similar con el mismo comercio, fecha y total. Revisa el existente; confirma una operación distinta solo si lo verificaste.');
 if(p.supersedesId){
 const previous=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',p.supersedesId);
 if(!previous||previous.deletedAt||previous.version!==p.expectedDocumentVersion)throw new UserInputError('El documento anterior cambió. Vuelve a abrirlo.');
 if(financial||previous.movementId!==links.movementId||previous.billId!==links.billId)throw new UserInputError('Corregir un comprobante conserva su vínculo financiero; no crea otra transacción.');
 if(await db.getFirstAsync('SELECT id FROM documents WHERE supersedes_id=?',previous.id))throw new UserInputError('Este documento ya tiene una corrección; abre la versión más reciente.');
 }
 if(p.kind==='attachment'){
 if(p.movementId){const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',p.movementId);if(!m||m.deletedAt||m.version!==p.expectedMovementVersion)throw new UserInputError('La transacción cambió o está eliminado. Vuelve a revisarlo.');}
 if(p.billId){const b=await db.getFirstAsync<{version:number;voided:string|null}>('SELECT version,voided_at AS voided FROM bills WHERE id=?',p.billId);if(!b||b.voided||b.version!==p.expectedBillVersion)throw new UserInputError('La factura cambió. Vuelve a revisarla.');}
 }
 if(p.incomeStatement)await validateStatementRules(db,p.incomeStatement,p.date!);
 const now=new Date().toISOString();
 if(p.kind==='paid_expense'||p.kind==='paid_income'){
 const kind=p.kind==='paid_expense'?'expense':'income';
 const m:LedgerMovement={id:links.movementId!,idempotencyKey:`document:${p.id}`,kind,amountCents:cents(p.amountCents!),currency:'USD',date:p.date!,description:p.description.trim(),categoryId:p.categoryId,paymentMethod:p.paymentMethod,taxReview:p.context==='business'&&!!p.incomeStatement,useKind:p.context==='business'?'business':'unknown',grossCents:p.incomeStatement?.grossCents==null?null:cents(p.incomeStatement.grossCents),withholdingCents:p.incomeStatement?statementTotals(p.incomeStatement).withholding:null,createdAt:now,updatedAt:now,deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1};validateMovement(m);
 if(p.categoryId){const c=await db.getFirstAsync<{kind:string;archived:number}>('SELECT kind,archived FROM categories WHERE id=?',p.categoryId);if(!c||c.archived||c.kind!==kind)throw new UserInputError('Selecciona una categoría activa del tipo correcto.');}
 if(!p.confirmSimilar&&await db.getFirstAsync('SELECT id FROM movements WHERE deleted_at IS NULL AND kind=? AND date=? AND amount_cents=?',kind,p.date,p.amountCents))throw new UserInputError('Hay una transacción similar. Revisa si debes adjuntar al existente o confirma que es otro distinto.');
 await new MovementRepository(db).create(m);
 if(p.businessHolderId)await linkCaptureCommercial(db,m,p.businessHolderId);
 if(kind==='expense'&&p.context==='business')await recordExpenseGuide(db,m,p.expenseAnswers);
 }else if(p.kind==='pending_bill'){
 const b={id:links.billId!,provider:p.description.trim()||'Proveedor por confirmar',amountCents:cents(p.amountCents!),dueDate:p.date!,categoryId:p.categoryId,paymentKind:'expense' as const,reminderDays:null};validateBill(b);
 if(p.categoryId){const c=await db.getFirstAsync<{kind:string;archived:number}>('SELECT kind,archived FROM categories WHERE id=?',p.categoryId);if(!c||c.archived||c.kind!=='expense')throw new UserInputError('Selecciona una categoría activa de gasto.');}
 if(!p.confirmSimilar&&await db.getFirstAsync('SELECT id FROM bills WHERE voided_at IS NULL AND lower(trim(provider))=lower(?) AND amount_cents=? AND due_date=?',b.provider,b.amountCents,b.dueDate))throw new UserInputError('Ya hay una factura similar. Revisa la existente o confirma que es otra distinta.');
 await db.runAsync('INSERT INTO bills(id,provider,amount_cents,due_date,category_id,payment_kind,reminder_days,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',b.id,b.provider,b.amountCents,b.dueDate,b.categoryId,b.paymentKind,null,now,now);
 }
 await db.runAsync(`INSERT INTO documents(id,movement_id,bill_id,sha256,encrypted_path,supersedes_id,status,source,record_kind,description,document_date,amount_cents,notes,raw_text,mime,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,p.id,links.movementId,links.billId,sha,p.keepImage?`sqlcipher:${p.id}`:null,p.supersedesId,'received',p.source,p.kind,p.description.trim(),p.date,p.amountCents,p.notes.trim(),p.rawText,p.image?.mime??null,now);
 if(p.reading)await db.runAsync('INSERT INTO document_readings(document_id,record_json,recorded_at) VALUES(?,?,?)',p.id,JSON.stringify(p.reading),now);
 if(p.incomeStatement)await db.runAsync('INSERT INTO income_statements(document_id,movement_id,record_json,created_at) VALUES(?,?,?,?)',p.id,links.movementId,JSON.stringify(p.incomeStatement),now);
 if(p.keepImage)await db.runAsync('INSERT INTO document_contents(document_id,base64) VALUES(?,?)',p.id,p.image!.base64);
 if(p.supersedesId)await db.runAsync("UPDATE documents SET status='corrected',version=version+1 WHERE id=?",p.supersedesId);
 if(resolvedVoice){const tombstone=await this.digest('resolved-voice:'+resolvedVoice.id+':'+resolvedVoice.sha256);await db.runAsync('UPDATE documents SET deleted_at=?,sha256=?,version=version+1 WHERE id=?',now,tombstone,resolvedVoice.id);await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',resolvedVoice.id,'Dictado confirmado como transacción: '+p.id,JSON.stringify(resolvedVoice),now);}
 return p.id;
 });}
 private async voiceNote(db:SqlDb,id:string,version:number){
 const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);
 if(!d||d.version!==version||d.source!=='voice'||d.kind!=='note'||d.movementId||d.billId||d.deletedAt||d.status==='corrected'||d.supersedesId||await db.getFirstAsync('SELECT id FROM documents WHERE supersedes_id=?',id))throw new UserInputError('Abre el dictado pendiente actual. Las transacciones confirmados se corrigen en Historial.');
 return d;
 }
 async updateVoiceNote(id:string,version:number,text:string){
 const rawText=text.trim();if(!rawText||rawText.length>20000)throw new UserInputError('Revisa el texto del dictado (hasta 20,000 caracteres).');
 const description=rawText.replace(/\s+/g,' ').slice(0,100),notes=('Pendiente de revisión.\n\n'+rawText).slice(0,20000);
 const sha=await this.digest('text:'+JSON.stringify([description,null,null,notes,rawText,'note']));
 return this.ledger.transaction(async db=>{const d=await this.voiceNote(db,id,version);const duplicate=await db.getFirstAsync<{id:string}>('SELECT id FROM documents WHERE sha256=? AND id<>?',sha,id);if(duplicate)throw new DuplicateDocumentError(duplicate.id);await db.runAsync('UPDATE documents SET description=?,notes=?,raw_text=?,sha256=?,version=version+1 WHERE id=?',description,notes,rawText,sha,id);await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,'Edición de dictado pendiente',JSON.stringify(d),new Date().toISOString());});
 }
 async deleteVoiceNote(id:string,version:number){return this.ledger.transaction(async db=>{const d=await this.voiceNote(db,id,version),now=new Date().toISOString(),tombstone=await this.digest('deleted-voice:'+id+':'+d.sha256);await db.runAsync('UPDATE documents SET deleted_at=?,sha256=?,version=version+1 WHERE id=?',now,tombstone,id);await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,'Dictado pendiente retirado por el usuario',JSON.stringify(d),now);});}
 async detail(id:string){return this.ledger.read(async db=>({document:await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id),rawText:await db.getFirstAsync<{text:string|null}>('SELECT raw_text AS text FROM documents WHERE id=?',id),events:await db.getAllAsync<{reason:string;recordedAt:string}>('SELECT reason,recorded_at AS recordedAt FROM document_events WHERE document_id=? ORDER BY id DESC',id)}));}
 async setScanDeleted(id:string,version:number,deleted:boolean){return this.ledger.transaction(async db=>{const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);if(!d||d.source==='voice')throw new UserInputError('Escaneo no encontrado.');if(!!d.deletedAt===deleted)return;if(d.version!==version)throw new UserInputError('El escaneo cambió. Vuelve a abrirlo.');const now=new Date().toISOString();await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,deleted?'Escaneo retirado del historial por el usuario; transacción conservada':'Escaneo restaurado por el usuario',JSON.stringify(d),now);await db.runAsync('UPDATE documents SET deleted_at=?,version=version+1 WHERE id=?',deleted?now:null,id);});}
 async content(id:string){return this.ledger.read(db=>db.getFirstAsync<{base64:string;mime:string}>(`SELECT c.base64,d.mime FROM document_contents c JOIN documents d ON d.id=c.document_id WHERE d.id=? AND d.deleted_at IS NULL`,id));}
 async confirmReview(id:string,version:number,reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Explica la revisión (hasta 240 caracteres).');return this.ledger.transaction(async db=>{const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);if(!d||d.version!==version||d.status!=='pending')throw new UserInputError('Abre el comprobante pendiente actual.');await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,reason.trim(),JSON.stringify(d),new Date().toISOString());await db.runAsync("UPDATE documents SET status='received',version=version+1 WHERE id=?",id);});}
 async removeCopy(id:string,version:number,reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');return this.ledger.transaction(async db=>{
 const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);if(!d||d.version!==version)throw new UserInputError('El documento cambió. Vuelve a abrir su ficha.');if(!d.encryptedPath)return;
 if(!d.encryptedPath.startsWith('sqlcipher:'))throw new UserInputError('Esta referencia anterior requiere revisión; no se eliminarán archivos externos.');
 await db.execAsync('PRAGMA secure_delete=ON;');await db.runAsync('DELETE FROM document_contents WHERE document_id=?',id);await db.runAsync('UPDATE documents SET encrypted_path=NULL,copy_deleted_at=?,version=version+1 WHERE id=?',new Date().toISOString(),id);await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,reason.trim(),JSON.stringify(d),new Date().toISOString());
 });}
}
