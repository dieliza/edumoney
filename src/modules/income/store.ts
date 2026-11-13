import {UserInputError} from '../../core/errors';
import {cents} from '../../core/money';
import {deductionCategories,statementTotals,type DeductionCategory,type IncomeStatement} from './domain';
import {calculateDeduction,payerKey,validateRule,type DeductionRule} from './calculation';
import {movementSelect,type MoneyStore,type SqlDb} from '../money/store';
import {localToday,validDate} from '../money/domain';
export type IncomeHistory={documentId:string;movementId:string;json:string;sequence?:number;date:string;method:string;movementVersion:number;documentVersion:number;statement:IncomeStatement};
export function payerHistory(rows:Pick<IncomeHistory,'documentId'|'date'|'statement'|'sequence'>[],payer:string,year:string,date:string,excludeId?:string){
 const current=rows.find(r=>r.documentId===excludeId);let total=0;for(const row of rows){if(row.date===date&&current?.sequence!==undefined&&row.sequence!==undefined&&row.sequence>current.sequence)continue;if(row.documentId===excludeId||row.date>date||row.date.slice(0,4)!==year||payerKey(row.statement.issuer)!==payerKey(payer))continue;if(row.statement.grossCents===null)throw new UserInputError('Hay un pago previo de ese pagador sin bruto confirmado. Complétalo antes de aplicar el umbral.');total=cents(total+row.statement.grossCents);}return total;
}
export async function validateStatementRules(db:SqlDb,p:IncomeStatement,date:string,excludeId?:string){
 const allowed=new Set([...deductionCategories.map(c=>c.id),...(await db.getAllAsync<{id:string}>('SELECT id FROM income_deduction_categories')).map(c=>c.id)]);
 if(p.deductions.some(d=>!allowed.has(d.categoryId)))throw new UserInputError('Elige una categoría de deducción existente.');
 const fingerprints=p.deductions.map(d=>JSON.stringify([d.categoryId,payerKey(d.label),d.amountCents]));if(new Set(fingerprints).size!==fingerprints.length)throw new UserInputError('Hay una deducción duplicada con la misma categoría, descripción e importe.');
 const applied=p.deductions.filter(d=>d.calculation);if(new Set(applied.map(d=>d.categoryId)).size!==applied.length)throw new UserInputError('Hay una regla calculada repetida para la misma categoría. Revisa las deducciones.');
 const rows=(await db.getAllAsync<{documentId:string;sequence:number;date:string;json:string}>('SELECT i.rowid AS sequence,i.document_id AS documentId,m.date,i.record_json AS json FROM income_statements i JOIN movements m ON m.id=i.movement_id WHERE m.deleted_at IS NULL')).map(r=>({...r,statement:JSON.parse(r.json) as IncomeStatement}));
 for(const d of applied){const c=d.calculation!,r=c.rule;if(r.base==='threshold'&&r.mode==='percentage'){
 if(d.categoryId!=='pr-services'||payerKey(r.payer)!==payerKey(p.issuer)||r.year!==date.slice(0,4))throw new UserInputError('El umbral requiere la categoría de servicios PR y el mismo pagador legal y año del cheque.');
 const expected=calculateDeduction(r,p.grossCents,payerHistory(rows,r.payer,r.year,date,excludeId));if(expected.priorCents!==c.priorCents||expected.amountCents!==d.amountCents||expected.baseCents!==c.baseCents)throw new UserInputError('El historial del pagador cambió. Vuelve a revisar el cálculo antes de guardar.');
 }}statementTotals(p);
}
export class IncomeStore{
 constructor(private ledger:MoneyStore){}
 async snapshot(){return this.ledger.read(async db=>{
 const rules=await db.getAllAsync<{id:string;json:string}>('SELECT category_id AS id,rule_json AS json FROM income_deduction_rules');
 const categories=[...deductionCategories,...await db.getAllAsync<DeductionCategory>('SELECT id,name,kind FROM income_deduction_categories ORDER BY name')].map(c=>({...c,rule:rules.find(r=>r.id===c.id)?JSON.parse(rules.find(r=>r.id===c.id)!.json) as DeductionRule:undefined}));
 const statements=(await db.getAllAsync<Omit<IncomeHistory,'statement'>>('SELECT i.rowid AS sequence,i.document_id AS documentId,i.movement_id AS movementId,i.record_json AS json,m.date,m.payment_method AS method,m.version AS movementVersion,d.version AS documentVersion FROM income_statements i JOIN movements m ON m.id=i.movement_id JOIN documents d ON d.id=i.document_id WHERE m.deleted_at IS NULL AND d.deleted_at IS NULL ORDER BY m.date DESC,i.rowid DESC')).map(s=>({...s,statement:JSON.parse(s.json) as IncomeStatement}));return {categories,statements};});}
 async addCategory(id:string,name:string){return this.saveCategory(id,name);}
 async saveCategory(id:string,name:string,rule?:DeductionRule,editing=false){
 name=name.trim();if(!id||!name||name.length>60)throw new UserInputError('La categoría necesita un nombre de hasta 60 caracteres.');if(rule)validateRule(rule,!rule.active);
 return this.ledger.transaction(async db=>{
 const builtin=deductionCategories.find(c=>c.id===id);if(builtin&&(!editing||builtin.name!==name))throw new UserInputError('Las categorías originales conservan su nombre.');
 if(deductionCategories.some(c=>c.id!==id&&payerKey(c.name)===payerKey(name))||(await db.getAllAsync<{id:string;name:string}>('SELECT id,name FROM income_deduction_categories')).some(c=>c.id!==id&&payerKey(c.name)===payerKey(name)))throw new UserInputError('Esa categoría ya existe.');
 if(!builtin){if(editing){if(!(await db.runAsync('UPDATE income_deduction_categories SET name=? WHERE id=?',name,id)).changes)throw new UserInputError('La categoría ya no existe.');}else await db.runAsync("INSERT INTO income_deduction_categories(id,name,kind) VALUES(?,?,'other')",id,name);}
 if(rule)await db.runAsync('INSERT INTO income_deduction_rules(category_id,rule_json,updated_at) VALUES(?,?,?) ON CONFLICT(category_id) DO UPDATE SET rule_json=excluded.rule_json,updated_at=excluded.updated_at',id,JSON.stringify(rule),new Date().toISOString());
 });}
 async editStatement(original:IncomeHistory,p:IncomeStatement,date:string,method:string){
 if(!validDate(date)||date>localToday()||!['check','bank','cash','other'].includes(method))throw new UserInputError('Revisa la fecha recibida y el método.');
 for(const d of [p.periodStart,p.periodEnd])if(d!==null&&!validDate(d))throw new UserInputError('Revisa las fechas del período.');if(p.periodStart&&p.periodEnd&&p.periodStart>p.periodEnd)throw new UserInputError('El inicio supera el fin del período.');
 return this.ledger.transaction(async db=>{
 const current=await db.getFirstAsync<{json:string}>('SELECT record_json AS json FROM income_statements WHERE document_id=?',original.documentId);
 const movement=await db.getFirstAsync<import('../money/types').LedgerMovement>(movementSelect+' WHERE id=?',original.movementId);
 const document=await db.getFirstAsync<{version:number;deletedAt:string|null}>('SELECT version,deleted_at AS deletedAt FROM documents WHERE id=?',original.documentId);
 if(current?.json!==original.json||movement?.version!==original.movementVersion||document?.version!==original.documentVersion||movement?.deletedAt||document?.deletedAt||movement?.kind!=='income')throw new UserInputError('El cheque o su movimiento cambió. Vuelve a abrirlo antes de editar.');
 if(p.reference.trim()&&p.issuer.trim()){const prior=await db.getAllAsync<{id:string;json:string}>('SELECT i.document_id AS id,i.record_json AS json FROM income_statements i JOIN movements m ON m.id=i.movement_id WHERE substr(m.date,1,4)=? AND i.document_id<>?',date.slice(0,4),original.documentId);if(prior.some(r=>{const s=JSON.parse(r.json) as IncomeStatement;return payerKey(s.issuer)===payerKey(p.issuer)&&payerKey(s.reference)===payerKey(p.reference);}))throw new UserInputError('Ya existe otro cheque con esa referencia y pagador.');}
 await validateStatementRules(db,p,date,original.documentId);const now=new Date().toISOString();
 await db.runAsync('INSERT INTO income_statement_revisions(document_id,before_json,recorded_at) VALUES(?,?,?)',original.documentId,current!.json,now);
 await db.runAsync("INSERT INTO movement_revisions(movement_id,action,reason,before_json,recorded_at) VALUES(?,'edit',?,?,?)",original.movementId,'Corrección de cheque o talonario',JSON.stringify(movement),now);
 await db.runAsync('UPDATE income_statements SET record_json=? WHERE document_id=?',JSON.stringify(p),original.documentId);
 await db.runAsync('UPDATE movements SET amount_cents=?,gross_cents=?,withholding_cents=?,date=?,description=?,payment_method=?,updated_at=?,version=version+1 WHERE id=?',p.netCents,p.grossCents,statementTotals(p).withholding,date,p.issuer.trim()||'Comprobante de ingreso',method,now,original.movementId);
 await db.runAsync('INSERT INTO document_events(document_id,reason,before_json,recorded_at) VALUES(?,?,?,?)',original.documentId,'Corrección de desglose; foto original conservada',JSON.stringify(original),now);
 await db.runAsync('UPDATE documents SET amount_cents=?,document_date=?,description=?,version=version+1 WHERE id=?',p.netCents,date,p.issuer.trim()||'Comprobante de ingreso',original.documentId);
 });}
}
