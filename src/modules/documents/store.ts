import { UserInputError } from '../../core/errors';
import { cents } from '../../core/money';
import { localToday,validDate,validateMovement } from '../money/domain';
import { validateBill } from '../bills/domain';
import { MovementRepository } from '../money/repository';
import { MoneyStore,movementSelect,readMovement } from '../money/store';
import type { LedgerMovement } from '../money/types';
import { validateImage } from './domain';
import type { DocumentInput,DocumentsSnapshot,StoredDocument } from './types';
export class DuplicateDocumentError extends UserInputError {constructor(public documentId:string){super('Este comprobante ya existe. Abre su ficha; no se registró otro movimiento.');}}
const select=`SELECT id,movement_id AS movementId,bill_id AS billId,sha256,encrypted_path AS encryptedPath,supersedes_id AS supersedesId,status,source,record_kind AS kind,description,document_date AS date,amount_cents AS amountCents,notes,mime,created_at AS createdAt,deleted_at AS deletedAt,copy_deleted_at AS copyDeletedAt,version FROM documents`;
const target=(p:DocumentInput)=>({movementId:p.kind==='paid_expense'||p.kind==='paid_income'?`document-movement:${p.id}`:p.movementId,billId:p.kind==='pending_bill'?`document-bill:${p.id}`:p.billId});
const canonical=(d:Pick<StoredDocument,'description'|'date'|'amountCents'|'notes'|'kind'|'source'|'supersedesId'|'movementId'|'billId'>)=>JSON.stringify([d.description.trim(),d.date,d.amountCents,d.notes.trim(),d.kind,d.source,d.supersedesId,d.movementId,d.billId]);
export class DocumentStore {
 constructor(private ledger:MoneyStore,private digest:(text:string)=>Promise<string>,private today=localToday){}
 async snapshot():Promise<DocumentsSnapshot>{return this.ledger.read(async db=>({documents:await db.getAllAsync<StoredDocument>(select+' ORDER BY rowid DESC'),movements:(await db.getAllAsync<LedgerMovement>(movementSelect+' ORDER BY date DESC')).map(readMovement),bills:await db.getAllAsync('SELECT id,provider,amount_cents AS amountCents,due_date AS dueDate,version FROM bills WHERE voided_at IS NULL ORDER BY due_date DESC'),categories:(await db.getAllAsync<{id:string;name:string;kind:'income'|'expense';archived:number}>('SELECT id,name,kind,archived FROM categories')).map(c=>({...c,archived:!!c.archived}))}));}
 async save(p:DocumentInput){
 if(!p.id||!p.reviewed||!p.description.trim()||p.description.length>240||p.notes.length>20000||(p.rawText?.length??0)>20000)throw new UserInputError('Revisa la descripción y confirma que comprobaste todos los datos.');
 if(!['paid_expense','paid_income','pending_bill','attachment','note'].includes(p.kind)||!['manual','camera','library','voice'].includes(p.source))throw new UserInputError('Elige cómo se guardará este documento.');
 if(p.date!==null&&!validDate(p.date)||p.amountCents!==null&&cents(p.amountCents)<=0)throw new UserInputError('Revisa la fecha AAAA-MM-DD y el importe positivo.');
 if(p.image)validateImage(p.image);if(p.keepImage&&!p.image)throw new UserInputError('No hay imagen para conservar.');
 const financial=['paid_expense','paid_income','pending_bill'].includes(p.kind);
 if(financial&&(!p.date||p.amountCents===null))throw new UserInputError('Confirma fecha e importe antes de crear el registro financiero.');
 if((p.kind==='paid_expense'||p.kind==='paid_income')&&p.date!>this.today())throw new UserInputError('No se confirma como recibido o pagado un movimiento futuro.');
 if(financial&&(p.movementId||p.billId))throw new UserInputError('Para vincular un registro existente elige Adjuntar; no crees otro.');
 if(p.kind==='attachment'&&Number(!!p.movementId)+Number(!!p.billId)!==1)throw new UserInputError('Elige un movimiento o una factura existente, solo uno.');
 if(p.kind==='note'&&(p.movementId||p.billId||!p.notes.trim()))throw new UserInputError('Una nota necesita texto confirmado y no crea movimientos.');
 const links=target(p);const material=p.image?`image:${p.image.mime}:${p.image.base64}`:`text:${JSON.stringify([p.description.trim(),p.date,p.amountCents,p.notes.trim(),p.rawText,p.kind])}`;const sha=await this.digest(material);
 if(!/^[a-f0-9]{64}$/.test(sha))throw new Error('Huella no válida');
 return this.ledger.transaction(async db=>{
 const old=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',p.id);
 if(old){if(old.sha256===sha&&canonical(old)===canonical({...p,...links})){const original=await db.getFirstAsync<{text:string|null}>('SELECT raw_text AS text FROM documents WHERE id=?',old.id);if(original?.text!==p.rawText)throw new UserInputError('El texto del reintento no coincide.');if(p.kind==='pending_bill'){const bill=await db.getFirstAsync<{category:string|null}>('SELECT category_id AS category FROM bills WHERE id=?',old.billId);if(bill?.category!==p.categoryId)throw new UserInputError('La categoría del reintento no coincide.');}if(p.kind==='paid_expense'||p.kind==='paid_income'){const m=await db.getFirstAsync<{method:string;category:string|null}>('SELECT payment_method AS method,category_id AS category FROM movements WHERE id=?',old.movementId);if(m?.method!==p.paymentMethod||m?.category!==p.categoryId)throw new UserInputError('El reintento no coincide con el movimiento original.');}return old.id;}throw new UserInputError('El identificador ya corresponde a otro documento.');}
 const duplicate=await db.getFirstAsync<{id:string}>('SELECT id FROM documents WHERE sha256=?',sha);if(duplicate)throw new DuplicateDocumentError(duplicate.id);
 if(p.supersedesId){
 const previous=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',p.supersedesId);
 if(!previous||previous.deletedAt||previous.version!==p.expectedDocumentVersion)throw new UserInputError('El documento anterior cambió. Vuelve a abrirlo.');
 if(financial||previous.movementId!==links.movementId||previous.billId!==links.billId)throw new UserInputError('Corregir un comprobante conserva su vínculo financiero; no crea otro movimiento.');
 if(await db.getFirstAsync('SELECT id FROM documents WHERE supersedes_id=?',previous.id))throw new UserInputError('Este documento ya tiene una corrección; abre la versión más reciente.');
 }
 if(p.kind==='attachment'){
 if(p.movementId){const m=await db.getFirstAsync<LedgerMovement>(movementSelect+' WHERE id=?',p.movementId);if(!m||m.deletedAt||m.version!==p.expectedMovementVersion)throw new UserInputError('El movimiento cambió o está eliminado. Vuelve a revisarlo.');}
 if(p.billId){const b=await db.getFirstAsync<{version:number;voided:string|null}>('SELECT version,voided_at AS voided FROM bills WHERE id=?',p.billId);if(!b||b.voided||b.version!==p.expectedBillVersion)throw new UserInputError('La factura cambió. Vuelve a revisarla.');}
 }
 const now=new Date().toISOString();
 if(p.kind==='paid_expense'||p.kind==='paid_income'){
 const kind=p.kind==='paid_expense'?'expense':'income';
 const m:LedgerMovement={id:links.movementId!,idempotencyKey:`document:${p.id}`,kind,amountCents:cents(p.amountCents!),currency:'USD',date:p.date!,description:p.description.trim(),categoryId:p.categoryId,paymentMethod:p.paymentMethod,taxReview:false,useKind:'unknown',grossCents:null,withholdingCents:null,createdAt:now,updatedAt:now,deletedAt:null,incomeType:'manual',scheduleId:null,occurrenceDate:null,version:1};validateMovement(m);
 if(p.categoryId){const c=await db.getFirstAsync<{kind:string;archived:number}>('SELECT kind,archived FROM categories WHERE id=?',p.categoryId);if(!c||c.archived||c.kind!==kind)throw new UserInputError('Selecciona una categoría activa del tipo correcto.');}
 if(!p.confirmSimilar&&await db.getFirstAsync('SELECT id FROM movements WHERE deleted_at IS NULL AND kind=? AND date=? AND amount_cents=?',kind,p.date,p.amountCents))throw new UserInputError('Hay un movimiento similar. Revisa si debes adjuntar al existente o confirma que es otro distinto.');
 await new MovementRepository(db).create(m);
 }else if(p.kind==='pending_bill'){
 const b={id:links.billId!,provider:p.description.trim(),amountCents:cents(p.amountCents!),dueDate:p.date!,categoryId:p.categoryId,paymentKind:'expense' as const,reminderDays:null};validateBill(b);
 if(p.categoryId){const c=await db.getFirstAsync<{kind:string;archived:number}>('SELECT kind,archived FROM categories WHERE id=?',p.categoryId);if(!c||c.archived||c.kind!=='expense')throw new UserInputError('Selecciona una categoría activa de gasto.');}
 if(!p.confirmSimilar&&await db.getFirstAsync('SELECT id FROM bills WHERE voided_at IS NULL AND lower(trim(provider))=lower(?) AND amount_cents=? AND due_date=?',b.provider,b.amountCents,b.dueDate))throw new UserInputError('Ya hay una factura similar. Revisa la existente o confirma que es otra distinta.');
 await db.runAsync('INSERT INTO bills(id,provider,amount_cents,due_date,category_id,payment_kind,reminder_days,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?)',b.id,b.provider,b.amountCents,b.dueDate,b.categoryId,b.paymentKind,null,now,now);
 }
 await db.runAsync(`INSERT INTO documents(id,movement_id,bill_id,sha256,encrypted_path,supersedes_id,status,source,record_kind,description,document_date,amount_cents,notes,raw_text,mime,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,p.id,links.movementId,links.billId,sha,p.keepImage?`sqlcipher:${p.id}`:null,p.supersedesId,'received',p.source,p.kind,p.description.trim(),p.date,p.amountCents,p.notes.trim(),p.rawText,p.image?.mime??null,now);
 if(p.keepImage)await db.runAsync('INSERT INTO document_contents(document_id,base64) VALUES(?,?)',p.id,p.image!.base64);
 if(p.supersedesId)await db.runAsync("UPDATE documents SET status='corrected',version=version+1 WHERE id=?",p.supersedesId);
 return p.id;
 });}
 async detail(id:string){return this.ledger.read(async db=>({document:await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id),rawText:await db.getFirstAsync<{text:string|null}>('SELECT raw_text AS text FROM documents WHERE id=?',id),events:await db.getAllAsync<{reason:string;recordedAt:string}>('SELECT reason,recorded_at AS recordedAt FROM document_events WHERE document_id=? ORDER BY id DESC',id)}));}
 async content(id:string){return this.ledger.read(db=>db.getFirstAsync<{base64:string;mime:string}>(`SELECT c.base64,d.mime FROM document_contents c JOIN documents d ON d.id=c.document_id WHERE d.id=? AND d.deleted_at IS NULL`,id));}
 async confirmReview(id:string,version:number,reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Explica la revisión (hasta 240 caracteres).');return this.ledger.transaction(async db=>{const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);if(!d||d.version!==version||d.status!=='pending')throw new UserInputError('Abre el comprobante pendiente actual.');await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,reason.trim(),JSON.stringify(d),new Date().toISOString());await db.runAsync("UPDATE documents SET status='received',version=version+1 WHERE id=?",id);});}
 async removeCopy(id:string,version:number,reason:string){if(!reason.trim()||reason.length>240)throw new UserInputError('Escribe un motivo de hasta 240 caracteres.');return this.ledger.transaction(async db=>{
 const d=await db.getFirstAsync<StoredDocument>(select+' WHERE id=?',id);if(!d||d.version!==version)throw new UserInputError('El documento cambió. Vuelve a abrir su ficha.');if(!d.encryptedPath)return;
 if(!d.encryptedPath.startsWith('sqlcipher:'))throw new UserInputError('Esta referencia anterior requiere revisión; no se eliminarán archivos externos.');
 await db.execAsync('PRAGMA secure_delete=ON;');await db.runAsync('DELETE FROM document_contents WHERE document_id=?',id);await db.runAsync('UPDATE documents SET encrypted_path=NULL,copy_deleted_at=?,version=version+1 WHERE id=?',new Date().toISOString(),id);await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',id,reason.trim(),JSON.stringify(d),new Date().toISOString());
 });}
}
